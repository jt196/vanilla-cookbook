import { prisma } from '$lib/server/prisma'
import {
	checkImageExistence,
	getContentTypeFromUrl,
	mapContentTypeToFileTypeAndExtension
} from '$lib/utils/image/imageUtils'
import { processImage } from '$lib/utils/image/imageBackend'
import { createRecipePhotoEntry, removeRecipePhotoEntry } from '$lib/utils/api'
import { saveFile, validImageTypes } from '$lib/utils/import/importHelpers'
import { fileTypeFromBuffer } from 'file-type'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { normalizeToString } from '$lib/utils/normalize'
import { regenerateRecipeEmbedding } from '$lib/server/semanticEmbedding'

export async function POST({ request, locals, url }) {
	const user = requireAuth(locals)
	const reqId = crypto.randomUUID().slice(0, 8)
	const startedAt = Date.now()
	const log = (message, extra = {}) =>
		console.log(`[recipe:create:${reqId}] ${message}`, { userId: user?.userId, ...extra })
	const warn = (message, extra = {}) =>
		console.warn(`[recipe:create:${reqId}] ${message}`, { userId: user?.userId, ...extra })
	const errorLog = (message, extra = {}) =>
		console.error(`[recipe:create:${reqId}] ${message}`, { userId: user?.userId, ...extra })

	const withTimeout = async (promiseFactory, ms, label) => {
		let timeoutId
		try {
			return await Promise.race([
				promiseFactory(),
				new Promise((_, reject) => {
					timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
				})
			])
		} finally {
			clearTimeout(timeoutId)
		}
	}

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

	// Process remote image_url if it exists and user opted to save
	if (saveImageUrl && image_url) {
		try {
			const remoteImageExists = await withTimeout(
				() => checkImageExistence(image_url, url.origin),
				8000,
				'remote image existence check'
			)
			log('remote image existence check finished', {
				recipeUid: recipe.uid,
				image_url,
				exists: !!remoteImageExists
			})
			if (remoteImageExists) {
				const contentType = await withTimeout(
					() => getContentTypeFromUrl(image_url),
					8000,
					'remote image content-type fetch'
				)
				const { extension } = mapContentTypeToFileTypeAndExtension(contentType)

				let photoEntry
				try {
					photoEntry = await createRecipePhotoEntry(recipe.uid, image_url, extension, true)
					await withTimeout(
						() => processImage(image_url, photoEntry.id, extension),
						15000,
						'remote image processing'
					)
					log('remote image processed', { recipeUid: recipe.uid, photoId: photoEntry.id })
				} catch (error) {
					errorLog('Failed to process remote image', {
						recipeUid: recipe?.uid,
						image_url,
						error: error?.message
					})
					if (photoEntry) {
						await removeRecipePhotoEntry(photoEntry.id)
					}
				}
			}
		} catch (error) {
			warn('Remote image step skipped', {
				recipeUid: recipe.uid,
				image_url,
				error: error?.message
			})
		}
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
