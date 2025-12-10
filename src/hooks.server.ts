import type { Handle } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import { getProjectByDomain } from '$lib/server/pb'

/**
 * Normalize a domain for matching
 * Removes port, www prefix, and lowercases
 */
function normalize_domain(host: string): string {
	return host
		.toLowerCase()
		.replace(/:\d+$/, '')  // Remove port
		.replace(/^www\./, '') // Remove www prefix
}

export const handle: Handle = async ({ event, resolve }) => {
	const url = new URL(event.request.url)
	const host = event.request.headers.get('host') || 'localhost'
	const domain = normalize_domain(host)

	// Store domain in locals for use by routes
	event.locals.domain = domain

	// Try to resolve project for this domain (async, cached per request)
	// We'll do this lazily - routes can call getProjectByDomain themselves

	// Proxy Pocketbase requests
	if (url.pathname.startsWith('/_pb/')) {
		const pbUrl = env.POCKETBASE_URL || 'http://127.0.0.1:8091'
		// Admin UI assets use relative paths from /_/, so we need to handle them specially
		// /_pb/_/... -> /_/...  (admin UI and its assets)
		// /_pb/api/... -> /api/... (API calls)
		// /_pb/libs/... -> /_/libs/... (admin assets referenced with relative paths)
		// /_pb/images/... -> /_/images/... (admin assets)
		// /_pb/assets/... -> /_/assets/... (admin assets)
		let targetPath = url.pathname.replace('/_pb/', '/')

		// Admin UI static assets need to be under /_/
		if (targetPath.startsWith('/libs/') || targetPath.startsWith('/images/') || targetPath.startsWith('/assets/') || targetPath.startsWith('/fonts/')) {
			targetPath = '/_' + targetPath
		}

		const targetUrl = `${pbUrl}${targetPath}${url.search}`

		try {
			const headers = new Headers(event.request.headers)
			headers.delete('host')
			// Don't request compressed responses - let the outer server handle compression
			headers.delete('accept-encoding')

			const response = await fetch(targetUrl, {
				method: event.request.method,
				headers,
				body: event.request.method !== 'GET' && event.request.method !== 'HEAD'
					? await event.request.arrayBuffer()
					: undefined
			})

			// Copy headers but remove content-encoding since we're proxying uncompressed
			const responseHeaders = new Headers(response.headers)
			responseHeaders.delete('content-encoding')
			responseHeaders.delete('content-length')

			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers: responseHeaders
			})
		} catch (error) {
			console.error('Pocketbase proxy error:', error)
			return new Response('Proxy error', { status: 500 })
		}
	}

	return resolve(event)
}
