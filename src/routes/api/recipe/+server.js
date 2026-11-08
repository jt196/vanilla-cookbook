import { prisma } from '$lib/server/prisma'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { normalizeToString } from '$lib/utils/normalize'
import {
	queueEmbeddingUpdate,
	requestLogger,
	saveImageUrlAsPhoto,
	saveUploadedPhotos
} from '$lib/server/recipeSave'

/**
 * Create a recipe. Multipart body: recipe JSON under `recipe`, image files under `images`.
 * With `saveImageUrl` (default true), `image_url` is downloaded as the main photo.
 */
export async function POST({ request, locals }) {
	const user = requireAuth(locals)
	const logger = requestLogger('recipe:create', { userId: user.userId })
	logger.log('start')

	const formData = await request.formData()
	let recipeData
	try {
		recipeData = JSON.parse(formData.get('recipe'))
	} catch (err) {
		logger.error('Failed to parse recipe payload', { error: err?.message })
		return jsonError(400, { error: 'Invalid recipe payload', code: 'recipe.msg.invalidPayload' })
	}

	const { cook_time, prep_time, total_time, servings, image_url, saveImageUrl = true } = recipeData

	let recipe
	try {
		recipe = await prisma.recipe.create({
			data: {
				name: recipeData.name,
				description: recipeData.description,
				source: recipeData.source,
				source_url: recipeData.source_url,
				image_url,
				notes: recipeData.notes,
				ingredients: recipeData.ingredients,
				equipment: recipeData.equipment,
				directions: recipeData.directions,
				nutritional_info: recipeData.nutritional_info,
				is_public: recipeData.is_public,
				cook_time: normalizeToString(cook_time),
				prep_time: normalizeToString(prep_time),
				total_time: normalizeToString(total_time),
				servings: normalizeToString(servings),
				created: new Date(),
				userId: user.userId
			}
		})
	} catch (err) {
		logger.error('Failed to create recipe', { name: recipeData.name, error: err?.message })
		return jsonError(500, {
			error: `Failed to create recipe: ${err.message}`,
			code: 'recipe.msg.createFail'
		})
	}
	logger.log('recipe row created', { recipeUid: recipe.uid, ms: logger.elapsed() })

	if (saveImageUrl && image_url) await saveImageUrlAsPhoto(recipe.uid, image_url, logger)
	await saveUploadedPhotos(recipe.uid, formData.getAll('images'), logger)
	queueEmbeddingUpdate(locals, recipe.uid)

	logger.log('success response', { recipeUid: recipe.uid, totalMs: logger.elapsed() })
	return jsonSuccess({ uid: recipe.uid })
}
