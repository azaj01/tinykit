import { json } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { env } from '$env/dynamic/private'
import { getProject, updateProject, createSnapshot, getLLMSettings, validateUserToken, unauthorizedResponse, type LLMSettings } from '$lib/server/pb'
import { type LLMProvider, type AgentMessage } from '$lib/ai/sdk-agent'
import { calculateCost } from '$lib/ai/types'

// Env var fallbacks
const ENV_LLM_PROVIDER = (env.LLM_PROVIDER as LLMProvider) || 'openai'
const ENV_LLM_API_KEY = env.LLM_API_KEY || ''
const ENV_LLM_MODEL = env.LLM_MODEL || 'gpt-4o'
const ENV_LLM_BASE_URL = env.LLM_BASE_URL

// Track running agents to prevent duplicate runs
const runningAgents = new Map<string, boolean>()

// Get LLM config from DB or fall back to env vars
async function getLLMConfig() {
	const dbSettings = await getLLMSettings()

	if (dbSettings && dbSettings.api_key) {
		return {
			provider: dbSettings.provider as LLMProvider,
			apiKey: dbSettings.api_key,
			model: dbSettings.model,
			baseUrl: dbSettings.base_url
		}
	}

	return {
		provider: ENV_LLM_PROVIDER,
		apiKey: ENV_LLM_API_KEY,
		model: ENV_LLM_MODEL,
		baseUrl: ENV_LLM_BASE_URL
	}
}

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 100
const RATE_LIMIT_WINDOW = 60 * 1000

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
	const now = Date.now()
	const record = rateLimitMap.get(ip)

	if (!record || now > record.resetTime) {
		rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
		return { allowed: true }
	}

	if (record.count >= RATE_LIMIT) {
		return { allowed: false, retryAfter: Math.ceil((record.resetTime - now) / 1000) }
	}

	record.count++
	return { allowed: true }
}

function formatError(error: any): string {
	const errorStr = String(error)
	console.error('[AI Service] Error:', error)

	if (errorStr.includes('429') || errorStr.includes('rate_limit')) {
		return 'AI service rate limit reached. Please wait a moment and try again.'
	}
	if (errorStr.includes('401') || errorStr.includes('invalid_api_key')) {
		return 'AI service authentication failed. Please check your API key configuration.'
	}
	if (errorStr.includes('ECONNREFUSED') || errorStr.includes('ETIMEDOUT')) {
		return 'Could not connect to AI service. Please check your network connection.'
	}
	return `AI service error: ${errorStr.slice(0, 200)}`
}

// GET - Get agent history
export const GET: RequestHandler = async ({ params, request }) => {
	const user = await validateUserToken(request)
	if (!user) return unauthorizedResponse('Authentication required')

	try {
		const project = await getProject(params.id)
		if (!project) {
			return json({ error: 'Project not found' }, { status: 404 })
		}
		return json({ messages: project.agent_chat || [] })
	} catch (error: any) {
		if (error.status === 404) {
			return json({ error: 'Project not found' }, { status: 404 })
		}
		return json({ error: 'Failed to load agent history' }, { status: 500 })
	}
}

// DELETE - Clear agent history
export const DELETE: RequestHandler = async ({ params, request }) => {
	const user = await validateUserToken(request)
	if (!user) return unauthorizedResponse('Authentication required')

	try {
		await updateProject(params.id, { agent_chat: [] })
		return json({ success: true })
	} catch (error: any) {
		if (error.status === 404) {
			return json({ error: 'Project not found' }, { status: 404 })
		}
		return json({ error: 'Failed to clear agent history' }, { status: 500 })
	}
}

// POST - Send prompt to agent (fire-and-forget, streams to database)
export const POST: RequestHandler = async ({ params, request, getClientAddress }) => {
	const user = await validateUserToken(request)
	if (!user) return unauthorizedResponse('Authentication required')

	const projectId = params.id

	try {
		const { prompt, messages, spec } = await request.json()

		// Extract user prompt from request
		let userPrompt = prompt
		if (!userPrompt && messages && Array.isArray(messages)) {
			const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop()
			userPrompt = lastUserMessage?.content || ''
		}

		if (!userPrompt) {
			return json({ error: 'Prompt is required' }, { status: 400 })
		}

		// Check if agent is already running for this project
		if (runningAgents.get(projectId)) {
			return json({ error: 'Agent is already processing a request' }, { status: 409 })
		}

		// Rate limit check
		const clientIp = getClientAddress()
		const rateCheck = checkRateLimit(clientIp)
		if (!rateCheck.allowed) {
			return json(
				{ error: `Rate limit exceeded. Try again in ${rateCheck.retryAfter} seconds.` },
				{ status: 429, headers: { 'Retry-After': String(rateCheck.retryAfter) } }
			)
		}

		// Get project and LLM config
		const project = await getProject(projectId)
		if (!project) {
			return json({ error: 'Project not found' }, { status: 404 })
		}

		const llmConfig = await getLLMConfig()
		if (!llmConfig.apiKey) {
			return json({ error: 'AI not configured. Add your API key in Settings.' }, { status: 500 })
		}

		// Build conversation history (should include initial user message)
		const agentMessages = project.agent_chat || []

		// Add placeholder assistant message (will be updated as chunks arrive)
		const assistantMsgIndex = agentMessages.length
		agentMessages.push({
			role: 'assistant',
			content: '',
			stream_items: [],
			status: 'running',
			timestamp: Date.now()
		})

		// Save initial state with user message and running assistant
		await updateProject(projectId, {
			agent_chat: agentMessages,
			agent_status: 'running'
		})

		// Mark agent as running
		runningAgents.set(projectId, true)

		// Create snapshot before agent makes changes
		const truncatedPrompt = userPrompt.length > 60 ? userPrompt.slice(0, 60) + '...' : userPrompt
		createSnapshot(projectId, `Before: ${truncatedPrompt}`).catch(console.error)

		// Convert to AgentMessage format for LLM
		const conversationHistory: AgentMessage[] = agentMessages
			.filter((m: any) => m.role === 'user' || (m.role === 'assistant' && m.content))
			.map((m: any) => ({ role: m.role, content: m.content }))

		// Fire-and-forget: run agent in background
		runAgentInBackground(projectId, llmConfig, agentMessages, assistantMsgIndex, conversationHistory, spec, truncatedPrompt)

		// Return immediately
		return json({ started: true, status: 'running' })

	} catch (error: any) {
		runningAgents.delete(projectId)
		if (error.status === 404) {
			return json({ error: 'Project not found' }, { status: 404 })
		}
		const formattedError = formatError(error)
		return json({ error: formattedError }, { status: 500 })
	}
}

// Background agent execution - updates database as it runs
async function runAgentInBackground(
	projectId: string,
	llmConfig: { provider: LLMProvider; apiKey: string; model: string; baseUrl?: string },
	agentMessages: any[],
	assistantMsgIndex: number,
	conversationHistory: AgentMessage[],
	spec: string,
	truncatedPrompt: string
) {
	let fullResponse = ''
	const toolCalls: Array<{ name: string; args?: Record<string, any>; result?: string }> = []
	const streamItems: Array<{ type: 'text' | 'tool'; content?: string; name?: string; args?: Record<string, any>; result?: string }> = []

	// Throttle DB updates to avoid hammering Pocketbase
	let lastDbUpdate = 0
	const DB_UPDATE_INTERVAL = 300 // ms
	let pendingDbUpdate = false

	async function updateDb(force = false) {
		const now = Date.now()
		if (!force && now - lastDbUpdate < DB_UPDATE_INTERVAL) {
			// Schedule a pending update if not already scheduled
			if (!pendingDbUpdate) {
				pendingDbUpdate = true
				setTimeout(() => {
					pendingDbUpdate = false
					updateDb(true)
				}, DB_UPDATE_INTERVAL - (now - lastDbUpdate))
			}
			return
		}
		lastDbUpdate = now

		// Update assistant message in place
		agentMessages[assistantMsgIndex] = {
			...agentMessages[assistantMsgIndex],
			content: fullResponse,
			stream_items: [...streamItems],
			tool_calls: toolCalls.length > 0 ? [...toolCalls] : undefined
		}

		try {
			await updateProject(projectId, { agent_chat: agentMessages })
		} catch (err) {
			console.error('[Agent] Failed to update DB:', err)
		}
	}

	try {
		const { run_agent } = await import('$lib/ai/sdk-agent')

		const result = await run_agent(llmConfig, projectId, conversationHistory, spec, {
			onText: (text) => {
				fullResponse += text
				// Add to stream_items (append to last text item if exists)
				const lastItem = streamItems[streamItems.length - 1]
				if (lastItem && lastItem.type === 'text') {
					lastItem.content = (lastItem.content || '') + text
				} else {
					streamItems.push({ type: 'text', content: text })
				}
				updateDb()
			},
			onToolCallStart: (name) => {
				// Add pending tool to stream_items
				streamItems.push({ type: 'tool', name, result: undefined })
				updateDb()
			},
			onToolCall: (name, args) => {
				toolCalls.push({ name, args })
				// Update the pending tool item with args
				const pendingTool = streamItems.find(s => s.type === 'tool' && s.name === name && !s.result)
				if (pendingTool) pendingTool.args = args
				updateDb()
			},
			onToolResult: (name, resultStr) => {
				console.log('[Agent] onToolResult:', name, resultStr?.slice?.(0, 100) || resultStr)
				const call = toolCalls.find(c => c.name === name && !c.result)
				if (call) call.result = resultStr
				// Update the tool item with result
				const toolItem = streamItems.find(s => s.type === 'tool' && s.name === name && !s.result)
				if (toolItem) toolItem.result = resultStr
				updateDb(true) // Force update on tool result
			},
			onError: (error) => {
				console.error('[Agent Error]', error)
			}
		})

		// Calculate cost
		const cost = calculateCost(llmConfig.model, {
			promptTokens: result.usage.promptTokens,
			completionTokens: result.usage.completionTokens,
			totalTokens: result.usage.promptTokens + result.usage.completionTokens
		}, llmConfig.provider)

		// Final update with completed status
		agentMessages[assistantMsgIndex] = {
			role: 'assistant',
			content: fullResponse,
			stream_items: streamItems,
			tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
			usage: {
				promptTokens: result.usage.promptTokens,
				completionTokens: result.usage.completionTokens,
				totalTokens: result.usage.promptTokens + result.usage.completionTokens,
				model: llmConfig.model,
				cost
			},
			status: 'complete',
			timestamp: Date.now()
		}

		await updateProject(projectId, {
			agent_chat: agentMessages,
			agent_status: 'idle'
		})

		// Create snapshot after
		await createSnapshot(projectId, `After: ${truncatedPrompt}`)

	} catch (error: any) {
		console.error('[Agent] Background execution failed:', error)
		const formattedError = formatError(error)

		// Update with error status
		agentMessages[assistantMsgIndex] = {
			...agentMessages[assistantMsgIndex],
			content: fullResponse || `Error: ${formattedError}`,
			status: 'error',
			error: formattedError,
			timestamp: Date.now()
		}

		await updateProject(projectId, {
			agent_chat: agentMessages,
			agent_status: 'error'
		}).catch(console.error)

	} finally {
		runningAgents.delete(projectId)
	}
}
