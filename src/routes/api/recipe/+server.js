import { prisma } from '$lib/server/prisma'
import { mapContentTypeToFileTypeAndExtension } from '$lib/utils/image/imageUtils'
import { saveRemoteImageAsPhoto } from '$lib/utils/image/imageBackend'
import { createRecipePhotoEntry, removeRecipePhotoEntry } from '$lib/utils/api'
import { saveFile, validImageTypes } from '$lib/utils/import/importHelpers'
import { fileTypeFromBuffer } from 'file-type'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { normalizeToString } from '$lib/utils/normalize'
import { regenerateRecipeEmbedding } from '$lib/server/semanticEmbedding'

export async function POST({ request, locals }) {
	const user = requireAuth(locals)
	const reqId = crypto.randomUUID().slice(0, 8)
	const startedAt = Date.now()
	const log = (message, extra = {}) =>
		console.log(`[recipe:create:${reqId}] ${message}`, { userId: user?.userId, ...extra })
	const warn = (message, extra = {}) =>
		console.warn(`[recipe:create:${reqId}] ${message}`, { userId: user?.userId, ...extra })
	const errorLog = (message, extra = {}) =>
		console.error(`[recipe:create:${reqId}] ${message}`, { userId: user?.userId, ...extra })

	log('start')

	const formData = await request.formData()
	let recipeData
	try {
		const rawRecipe = formData.get('recipe')
		recipeData = JSON.parse(rawRecipe)
	} catch (err) {
		errorLog('Failed to parse recipe payload', { error: err?.message })
		return jsonError(400, {
			error: 'Invalid recipe payload',
			code: 'recipe.msg.invalidPayload'
		})
	}
	const imageData = formData.getAll('images')

	const {
		name,
		description,
		source,
		source_url,
		cook_time,
		image_url,
		prep_time,
		notes,
		ingredients,
		equipment,
		directions,
		total_time,
		servings,
		nutritional_info,
		is_public,
		saveImageUrl = true
	} = recipeData

	let recipe
	try {
		recipe = await prisma.recipe.create({
			data: {
				name,
				description,
				source,
				source_url,
				cook_time: normalizeToString(cook_time),
				image_url,
				prep_time: normalizeToString(prep_time),
				notes,
				ingredients,
				equipment,
				directions,
				total_time: normalizeToString(total_time),
				servings: normalizeToString(servings),
				nutritional_info,
				is_public,
				created: new Date(),
				userId: user.userId
			}
		})
	} catch (err) {
		errorLog('Failed to create recipe', { name, source, source_url, error: err?.message })
		return jsonError(500, {
			error: `Failed to create recipe: ${err.message}`,
			code: 'recipe.msg.createFail'
		})
	}
	log('recipe row created', { recipeUid: recipe.uid, ms: Date.now() - startedAt })

	// Download the image URL now (if the user opted to save it); nothing is stored if it fails
	if (saveImageUrl && image_url) {
		const photo = await saveRemoteImageAsPhoto({
			recipeUid: recipe.uid,
			url: image_url,
			isMain: true
		})
		if (photo) log('remote image saved', { recipeUid: recipe.uid, photoId: photo.id })
		else warn('Remote image not saved', { recipeUid: recipe.uid, image_url })
	}

	// Process uploaded image files
	for (const file of imageData) {
		let photoEntry
		try {
			const extension = mapContentTypeToFileTypeAndExtension(file.type).extension
			photoEntry = await createRecipePhotoEntry(recipe.uid, null, extension)
			const photoBuffer = await file.arrayBuffer()

			const fileTypeResult = await fileTypeFromBuffer(photoBuffer)
			if (!fileTypeResult || !validImageTypes.includes(fileTypeResult.ext)) {
				throw new Error('Invalid image type.')
			}

			const directory = 'uploads/images'
			const fullFilename = `${photoEntry.id}.${extension}`
			await saveFile(photoBuffer, fullFilename, directory)
		} catch (err) {
			errorLog('Error saving uploaded photo, deleting photo entry', {
				recipeUid: recipe?.uid,
				error: err?.message
			})
			if (photoEntry) {
				removeRecipePhotoEntry(photoEntry.id)
			}
		}
	}

	// Run semantic embedding update in background (non-blocking).
	if (locals.site?.semantic?.enabled) {
		const preferredEmbeddingProvider = locals.site?.semantic?.provider || null
		const preferredEmbeddingModel = locals.site?.semantic?.model || null
		regenerateRecipeEmbedding(
			recipe.uid,
			preferredEmbeddingProvider,
			preferredEmbeddingModel
		).catch((error) => {
			console.error('Failed background embedding update after recipe create:', recipe.uid, error)
		})
	}

	log('success response', { recipeUid: recipe.uid, totalMs: Date.now() - startedAt })
	return jsonSuccess({ uid: recipe.uid })
}
