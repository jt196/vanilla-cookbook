import { error } from '@sveltejs/kit'
import { requireAuth, jsonSuccess } from '$lib/server/authHelpers'
import { downloadLinkOnlyPhotos } from '$lib/utils/image/imageBackend.js'

/**
 * Download recipe photos that only exist as a remote link, so they're stored locally.
 *
 * POST /api/user/[id]/photos/download-missing
 * Response: { downloaded: number, failed: string[] } (failed = recipe names)
 */
export async function POST({ locals, params }) {
	const user = requireAuth(locals)
	if (user.userId !== params.id) throw error(403, 'Unauthorized')

	return jsonSuccess(await downloadLinkOnlyPhotos(user.userId))
}
