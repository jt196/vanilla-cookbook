import { prisma } from '$lib/server/prisma'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function POST({ locals, params }) {
	const user = requireAuth(locals)
	const { uid } = params

	try {
		const recipe = await prisma.recipe.findUnique({
			where: { uid },
			include: {
				photos: {
					orderBy: [{ isMain: 'desc' }, { id: 'asc' }],
					select: {
						url: true,
						fileType: true,
						isMain: true
					}
				}
			}
		})

		if (!recipe) {
			return jsonError(404, { error: 'Recipe not found', code: 'recipe.msg.notFound' })
		}

		if (recipe.userId === user.userId) {
			return jsonError(400, {
				error: 'Cannot duplicate your own recipe',
				code: 'recipe.msg.duplicateOwn'
			})
		}

		if (!recipe.is_public && recipe.userId !== user.userId && !user.isAdmin) {
			return jsonError(403, {
				error: 'Access denied: this recipe is private',
				code: 'recipe.msg.privateAccessDenied'
			})
		}

		const existingFork = await prisma.recipe.findFirst({
			where: {
				userId: user.userId,
				parentRecipeId: uid
			},
			select: { uid: true }
		})
		if (existingFork) {
			return jsonError(409, {
				error: 'You have already copied this recipe',
				code: 'recipe.msg.duplicateExists'
			})
		}

		const newRecipe = await prisma.recipe.create({
			data: {
				userId: user.userId,
				parentRecipeId: uid,
				name: recipe.name,
				ingredients: recipe.ingredients,
				ingredients_original: recipe.ingredients_original,
				directions: recipe.directions,
				directions_original: recipe.directions_original,
				description: recipe.description,
				source: recipe.source,
				source_url: recipe.source_url,
				prep_time: recipe.prep_time,
				cook_time: recipe.cook_time,
				total_time: recipe.total_time,
				servings: recipe.servings,
				notes: recipe.notes,
				difficulty: recipe.difficulty,
				nutritional_info: recipe.nutritional_info,
				image_url: recipe.image_url,
				photo_url: recipe.photo_url,
				created: new Date(),
				is_public: false,
				is_pinned: false,
				in_trash: false,
				on_favorites: false,
				rating: null,
				on_grocery_list: false
			}
		})

		const remotePhotos = recipe.photos.filter((photo) => photo.url)
		if (remotePhotos.length > 0) {
			await prisma.recipePhoto.createMany({
				data: remotePhotos.map((photo, index) => ({
					recipeUid: newRecipe.uid,
					url: photo.url,
					fileType: photo.fileType,
					isMain: index === 0
				}))
			})
		}

		return jsonSuccess({ uid: newRecipe.uid, code: 'recipe.msg.duplicated' })
	} catch (err) {
		console.error('Error duplicating recipe:', err)
		return jsonError(500, {
			error: `Failed to duplicate recipe: ${err.message}`,
			code: 'recipe.msg.duplicateFail'
		})
	}
}
