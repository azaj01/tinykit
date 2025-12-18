import { error } from '@sveltejs/kit'
import type { RequestHandler } from './$types'
import { getProject, pb } from '$lib/server/pb'

/**
 * Assets Proxy API - Serve project assets (path-based project_id)
 *
 * GET /_tk/assets/{project_id}/{filename} - Get asset file
 *
 * This route handles the path-based format used in preview mode,
 * allowing clean query params for thumb/download options.
 *
 * Query params:
 *   - thumb: Thumbnail size, e.g. "100x100" (optional, for images)
 *   - download: Force download instead of preview (optional)
 */

export const GET: RequestHandler = async ({ params, url }) => {
	const { project_id, filename } = params
	const thumb = url.searchParams.get('thumb')

	try {
		const project = await getProject(project_id)

		if (!project) {
			throw error(404, 'Project not found')
		}

		// Check if file exists in project assets
		const assets = project.assets || []
		if (!assets.includes(filename)) {
			throw error(404, 'Asset not found')
		}

		// Build Pocketbase file URL
		const file_url = pb.files.getURL(
			{ id: project.id, collectionId: project.collectionId || '_tk_projects' },
			filename,
			thumb ? { thumb } : undefined
		)

		// Proxy the file from Pocketbase
		const response = await fetch(file_url)

		if (!response.ok) {
			throw error(response.status, 'Failed to fetch asset')
		}

		// Get content type from response
		const content_type = response.headers.get('content-type') || 'application/octet-stream'

		// Return the file with appropriate headers
		return new Response(response.body, {
			status: 200,
			headers: {
				'Content-Type': content_type,
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		})
	} catch (err: any) {
		if (err.status) {
			throw err
		}
		console.error('[Assets API] Error:', err)
		throw error(500, 'Failed to serve asset')
	}
}
