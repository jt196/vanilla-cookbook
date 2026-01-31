import { prisma } from '$lib/server/prisma'
import { requireAuth, requireOwnership, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function PUT({ locals, params }) {
	const user = requireAuth(locals)
	const { uid } = params

	try {
		const recipe = await prisma.recipe.findUnique({
			where: { uid }
		})

		requireOwnership(user, recipe)

		await prisma.recipe.update({
			where: { uid },
			data: {
				on_favorites: !recipe.on_favorites
			}
		})

		return jsonSuccess({ message: 'Recipe favourited!' })
	} catch (err) {
		if (err.status) throw err // Re-throw SvelteKit errors
		return jsonError(500, `Failed to add recipe to favourites: ${err.message}`)
	}
}
