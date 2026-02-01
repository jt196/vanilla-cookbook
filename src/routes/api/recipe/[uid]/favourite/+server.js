import { prisma } from '$lib/server/prisma'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function PUT({ locals, params }) {
	const user = requireAuth(locals)
	const { uid } = params

	try {
		const recipe = await prisma.recipe.findUnique({
			where: { uid },
			select: {
				uid: true,
				userId: true,
				is_public: true
			}
		})

		if (!recipe) {
			return jsonError(404, 'Recipe not found')
		}

		if (!recipe.is_public && recipe.userId !== user.userId && !user.isAdmin) {
			return jsonError(403, 'Access denied: this recipe is private')
		}

		const existing = await prisma.recipeFavorite.findUnique({
			where: {
				userId_recipeUid: {
					userId: user.userId,
					recipeUid: uid
				}
			}
		})

		if (existing) {
			await prisma.recipeFavorite.delete({
				where: { id: existing.id }
			})
			return jsonSuccess({ message: 'Recipe unfavourited!', favourited: false })
		}

		await prisma.recipeFavorite.create({
			data: {
				userId: user.userId,
				recipeUid: uid
			}
		})

		return jsonSuccess({ message: 'Recipe favourited!', favourited: true })
	} catch (err) {
		if (err.status) throw err // Re-throw SvelteKit errors
		return jsonError(500, `Failed to add recipe to favourites: ${err.message}`)
	}
}
