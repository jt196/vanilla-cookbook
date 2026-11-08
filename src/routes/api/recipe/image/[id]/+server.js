import { prisma } from '$lib/server/prisma'
import { deleteSinglePhotoFile, photoFilePath } from '$lib/utils/image/imageBackend.js'
import fs from 'fs'
import { requireAuth, requireOwnership, jsonSuccess, jsonError } from '$lib/server/authHelpers'

// Raster formats only. Anything else (e.g. an extension taken from an imported file name)
// is served as a download so the browser never renders it inline.
const IMAGE_TYPES = {
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp',
	avif: 'image/avif',
	bmp: 'image/bmp'
}

/**
 * Serve a stored recipe photo. Only local files are served; photos that exist only as a
 * remote link can be downloaded with "Download missing images" in Settings → Recipes.
 */
export async function GET({ params }) {
	const photo = await prisma.recipePhoto.findUnique({ where: { id: params.id } })
	if (!photo?.fileType) return new Response(null, { status: 204 })

	const filePath = photoFilePath(photo.id, photo.fileType)
	if (!fs.existsSync(filePath)) return new Response(null, { status: 204 })

	return new Response(fs.readFileSync(filePath), {
		headers: {
			'Content-Type': IMAGE_TYPES[photo.fileType.toLowerCase()] || 'application/octet-stream',
			'X-Content-Type-Options': 'nosniff'
		}
	})
}

export async function DELETE({ params, locals }) {
	const user = requireAuth(locals)
	const { id } = params

	try {
		const photo = await prisma.recipePhoto.findUniqueOrThrow({
			where: { id }
		})

		const recipe = await prisma.recipe.findUniqueOrThrow({
			where: { uid: photo.recipeUid }
		})

		requireOwnership(user, recipe)

		const fileDeleted = deleteSinglePhotoFile(photo.id, photo.fileType)
		if (!fileDeleted) {
			console.log('Failed to delete the local file, but proceeding with database deletion.')
		}

		await prisma.recipePhoto.delete({
			where: { id }
		})

		return jsonSuccess({
			message: 'Photo deleted successfully',
			code: 'photos.msg.deleted',
			uid: id
		})
	} catch (err) {
		if (err.status) throw err
		return jsonError(500, {
			error: `Failed to delete photo: ${err.message}`,
			code: 'photos.msg.deleteFail'
		})
	}
}
