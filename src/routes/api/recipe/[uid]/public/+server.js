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
				is_public: !recipe.is_public
			}
		})

		return jsonSuccess({ message: 'Recipe visibility toggled!' })
	} catch (err) {
		if (err.status) throw err
		return jsonError(500, `Failed to update recipe visibility: ${err.message}`)
	}
}
