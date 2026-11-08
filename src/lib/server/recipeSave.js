/**
 * Steps shared by recipe create (POST /api/recipe) and update (PUT /api/recipe/[uid]).
 *
 * @module recipeSave
 */
import { fileTypeFromBuffer } from 'file-type'
import { prisma } from '$lib/server/prisma'
import { regenerateRecipeEmbedding } from '$lib/server/semanticEmbedding'
import { createRecipePhotoEntry, removeRecipePhotoEntry } from '$lib/utils/api'
import { saveRemoteImageAsPhoto } from '$lib/utils/image/imageBackend'
import { mapContentTypeToFileTypeAndExtension } from '$lib/utils/image/imageUtils'
import { saveFile, validImageTypes } from '$lib/utils/import/importHelpers'

/**
 * Console logging tagged with a short request id, so one save's log lines can be followed.
 *
 * @param {string} scope - e.g. 'recipe:create'
 * @param {object} context - Fields added to every line (user id, recipe uid, ...)
 */
export function requestLogger(scope, context) {
	const tag = `[${scope}:${crypto.randomUUID().slice(0, 8)}]`
	const startedAt = Date.now()
	const line =
		(method) =>
		(message, extra = {}) =>
			console[method](`${tag} ${message}`, { ...context, ...extra })
	return {
		log: line('log'),
		warn: line('warn'),
		error: line('error'),
		elapsed: () => Date.now() - startedAt
	}
}

/**
 * Store uploaded image files as photos of a recipe. Files that aren't a supported image
 * are skipped; one bad file doesn't stop the others.
 *
 * @param {string} recipeUid
 * @param {File[]} files - From `formData.getAll('images')`
 * @param {ReturnType<typeof requestLogger>} logger
 */
export async function saveUploadedPhotos(recipeUid, files, logger) {
	for (const file of files) {
		let photo = null
		try {
			const buffer = await file.arrayBuffer()
			const detected = await fileTypeFromBuffer(buffer)
			if (!detected || !validImageTypes.includes(detected.ext)) {
				throw new Error('Invalid image type.')
			}

			const { extension } = mapContentTypeToFileTypeAndExtension(file.type)
			photo = await createRecipePhotoEntry(recipeUid, null, extension)
			await saveFile(buffer, `${photo.id}.${extension}`, 'uploads/images')
		} catch (err) {
			logger.error('Could not save uploaded photo', { recipeUid, error: err?.message })
			if (photo) await removeRecipePhotoEntry(photo.id).catch(() => {})
		}
	}
}

/**
 * Download the recipe's image URL as a stored photo, unless it's already saved. The photo
 * becomes the main one if the recipe has none.
 *
 * @param {string} recipeUid
 * @param {string} url
 * @param {ReturnType<typeof requestLogger>} logger
 */
export async function saveImageUrlAsPhoto(recipeUid, url, logger) {
	const [alreadySaved, hasMainPhoto] = await Promise.all([
		prisma.recipePhoto.findFirst({ where: { recipeUid, url } }),
		prisma.recipePhoto.findFirst({ where: { recipeUid, isMain: true } })
	])
	if (alreadySaved) return

	const photo = await saveRemoteImageAsPhoto({ recipeUid, url, isMain: !hasMainPhoto })
	if (photo) logger.log('remote image saved', { photoId: photo.id })
	else logger.warn('Remote image not saved', { image_url: url })
}

/**
 * Refresh the recipe's semantic-search embedding in the background, if semantic search is on.
 *
 * @param {import('@sveltejs/kit').RequestEvent['locals']} locals
 * @param {string} recipeUid
 */
export function queueEmbeddingUpdate(locals, recipeUid) {
	const semantic = locals.site?.semantic
	if (!semantic?.enabled) return
	regenerateRecipeEmbedding(recipeUid, semantic.provider || null, semantic.model || null).catch(
		(error) => console.error('Background embedding update failed:', recipeUid, error)
	)
}
