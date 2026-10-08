import { requireUser } from '$lib/server/authPage'
import { findLinkOnlyPhotos } from '$lib/utils/image/imageBackend.js'

export const load = async ({ locals }) => {
	const user = requireUser(locals)
	const linkOnlyPhotos = await findLinkOnlyPhotos(user.userId)
	return { linkOnlyPhotoCount: linkOnlyPhotos.length }
}
