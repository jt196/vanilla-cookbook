import { requireUser } from '$lib/server/authPage'
import { findLinkOnlyPhotos } from '$lib/utils/image/imageBackend.js'

/**
 * Recipe options page: how many of the user's photos exist only as a remote link.
 *
 * @type {import('./$types').PageServerLoad}
 */
export const load = async ({ locals }) => {
	const user = requireUser(locals)
	const linkOnlyPhotos = await findLinkOnlyPhotos(user.userId)
	return { linkOnlyPhotoCount: linkOnlyPhotos.length }
}
