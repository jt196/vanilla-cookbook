import { prisma } from '$lib/server/prisma'
import {
	deleteSinglePhotoFile,
	photoFilePath,
	photoThumbnailPath,
	THUMBNAIL_WIDTHS
} from '$lib/utils/image/imageBackend.js'
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

// Photo ids are never reused, so browsers can keep a photo for a long time and revalidate
// with the ETag. `private` keeps shared proxies from storing photos of private recipes.
const CACHE_CONTROL = 'private, max-age=2592000'

const noContent = () =>
	new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })

/**
 * Serve a stored recipe photo, or with `?w=400` a cached WebP thumbnail of it.
 * Only local files are served; photos that exist only as a remote link can be downloaded
 * with "Download missing images" in Settings → Recipes.
 */
export async function GET({ params, url, request }) {
	const photo = await prisma.recipePhoto.findUnique({ where: { id: params.id } })
	if (!photo?.fileType) return noContent()

	const width = Number(url.searchParams.get('w'))
	const thumbnail = THUMBNAIL_WIDTHS.includes(width) ? await photoThumbnailPath(photo, width) : null
	const filePath = thumbnail ?? photoFilePath(photo.id, photo.fileType)
	const contentType = thumbnail
		? 'image/webp'
		: IMAGE_TYPES[photo.fileType.toLowerCase()] || 'application/octet-stream'

	const stat = await fs.promises.stat(filePath).catch(() => null)
	if (!stat) return noContent()

	const headers = {
		'Cache-Control': CACHE_CONTROL,
		ETag: `"${stat.size.toString(36)}-${Math.floor(stat.mtimeMs).toString(36)}"`,
		'X-Content-Type-Options': 'nosniff'
	}
	if (request.headers.get('if-none-match') === headers.ETag) {
		return new Response(null, { status: 304, headers })
	}

	return new Response(await fs.promises.readFile(filePath), {
		headers: { ...headers, 'Content-Type': contentType }
	})
}

/**
 * Delete a photo (row and file) from one of the current user's recipes.
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
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
