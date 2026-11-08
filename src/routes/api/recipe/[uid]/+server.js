import { prisma } from '$lib/server/prisma'
import { deleteSinglePhotoFile } from '$lib/utils/image/imageBackend.js'
import {
	requireAuth,
	requireOwnership,
	getOptionalUser,
	jsonSuccess,
	jsonError
} from '$lib/server/authHelpers'
import {
	queueEmbeddingUpdate,
	requestLogger,
	saveImageUrlAsPhoto,
	saveUploadedPhotos
} from '$lib/server/recipeSave'

/**
 * Delete one of the current user's recipes and its photo files.
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
export async function DELETE({ params, locals }) {
	const user = requireAuth(locals)
	const { uid } = params

	try {
		const recipe = await prisma.recipe.findUnique({
			where: { uid }
		})

		requireOwnership(user, recipe)

		const photos = await prisma.recipePhoto.findMany({
			where: { recipeUid: uid }
		})

		for (const photo of photos) {
			deleteSinglePhotoFile(photo.id, photo.fileType)
		}

		await prisma.recipe.delete({
			where: { uid }
		})

		return jsonSuccess({ message: 'Recipe deleted successfully', code: 'recipe.msg.deleted', uid })
	} catch (err) {
		if (err.status) throw err
		return jsonError(500, {
			error: `Failed to delete recipe: ${err.message}`,
			code: 'recipe.msg.deleteFail'
		})
	}
}

// Fields the recipe form may change; anything else in the payload is ignored
const UPDATABLE_FIELDS = [
	'name',
	'description',
	'source',
	'source_url',
	'cook_time',
	'prep_time',
	'total_time',
	'servings',
	'ingredients',
	'ingredients_original',
	'equipment',
	'directions',
	'directions_original',
	'notes',
	'image_url',
	'photo_url',
	'photo',
	'photo_large',
	'nutritional_info',
	'difficulty',
	'rating',
	'scale',
	'is_public',
	'is_pinned',
	'in_trash',
	'on_favorites',
	'on_grocery_list',
	'parentRecipeId'
]
const STRING_FIELDS = ['cook_time', 'prep_time', 'total_time', 'servings']

/**
 * Update a recipe. Multipart body: recipe JSON under `recipe`, new image files under
 * `images`. With `saveImageUrl`, `image_url` is downloaded as a photo if not already saved.
 */
export async function PUT({ request, locals, params }) {
	const user = requireAuth(locals)
	const { uid } = params
	const logger = requestLogger('recipe:update', { userId: user.userId, recipeUid: uid })
	logger.log('start')

	const formData = await request.formData()
	let recipeData
	try {
		recipeData = JSON.parse(/** @type {string} */ (formData.get('recipe')))
	} catch (err) {
		logger.error('Failed to parse recipe payload', { error: err?.message })
		return jsonError(400, { error: 'Invalid recipe payload', code: 'recipe.msg.invalidPayload' })
	}

	const updates = Object.fromEntries(
		Object.entries(recipeData).filter(([key]) => UPDATABLE_FIELDS.includes(key))
	)
	for (const field of STRING_FIELDS) {
		updates[field] = recipeData[field] ? recipeData[field].toString() : null
	}

	try {
		const recipe = await prisma.recipe.findUnique({ where: { uid } })
		requireOwnership(user, recipe)

		await prisma.recipe.update({ where: { uid }, data: updates })
		logger.log('recipe row updated', { ms: logger.elapsed() })

		await saveUploadedPhotos(uid, /** @type {File[]} */ (formData.getAll('images')), logger)
		if (recipeData.saveImageUrl && recipeData.image_url) {
			await saveImageUrlAsPhoto(uid, recipeData.image_url, logger)
		}
		queueEmbeddingUpdate(locals, uid)

		logger.log('success response', { totalMs: logger.elapsed() })
		return jsonSuccess({ message: 'Recipe updated successfully', code: 'recipe.msg.updated' })
	} catch (err) {
		if (err.status) throw err
		logger.error('Error updating recipe', { error: err?.message })
		return jsonError(500, {
			error: `Failed to update recipe: ${err.message}`,
			code: 'recipe.msg.updateFail'
		})
	}
}

/**
 * A recipe with its photos, categories and parent, if the viewer may see it, plus whether
 * they've favourited or copied it.
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
export async function GET({ params, locals }) {
	const user = getOptionalUser(locals)
	const { uid } = params

	try {
		const recipe = await prisma.recipe.findUnique({
			where: { uid },
			include: {
				photos: {
					select: {
						id: true,
						url: true,
						fileType: true,
						isMain: true,
						notes: true
					}
				},
				categories: true,
				parentRecipe: {
					select: {
						uid: true,
						name: true
					}
				}
			}
		})

		if (!recipe) {
			return jsonError(404, { error: 'Recipe not found!', code: 'recipe.msg.notFound' })
		}

		// Check access: public recipes are accessible to all, private only to owner/admin
		if (!recipe.is_public) {
			if (!user) {
				return jsonError(401, {
					error: 'User not authenticated and recipe private.',
					code: 'recipe.msg.authRequiredForPrivate'
				})
			}
			if (recipe.userId !== user.userId && !user.isAdmin) {
				return jsonError(403, {
					error: 'Unauthorised!',
					code: 'recipe.msg.privateAccessDenied'
				})
			}
		}

		let favourited = false
		let duplicatedByViewer = false
		if (user) {
			const fav = await prisma.recipeFavorite.findUnique({
				where: {
					userId_recipeUid: {
						userId: user.userId,
						recipeUid: uid
					}
				}
			})
			favourited = !!fav

			const fork = await prisma.recipe.findFirst({
				where: {
					userId: user.userId,
					parentRecipeId: uid
				},
				select: { uid: true }
			})
			duplicatedByViewer = !!fork
		}

		// Exclude embedding fields - they're large and not needed for display
		// eslint-disable-next-line no-unused-vars
		const { embedding, embeddingModel, embeddingVersion, ...recipeWithoutEmbedding } = recipe
		return jsonSuccess({ ...recipeWithoutEmbedding, on_favorites: favourited, duplicatedByViewer })
	} catch (err) {
		return jsonError(500, {
			error: `Failed to fetch recipe: ${err.message}`,
			code: 'recipe.msg.loadFail'
		})
	}
}
