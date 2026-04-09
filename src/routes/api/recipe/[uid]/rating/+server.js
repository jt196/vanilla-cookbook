import { prisma } from '$lib/server/prisma'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function PUT({ request, locals, params }) {
	requireAuth(locals)
	const { uid } = params

	try {
		const { rating } = await request.json()
		const updatedRecipe = await prisma.recipe.update({
			where: { uid },
			data: { rating }
		})

		return jsonSuccess({
			message: 'Rating updated',
			code: 'recipe.msg.ratingUpdated',
			recipe: updatedRecipe
		})
	} catch (err) {
		return jsonError(500, {
			error: `Failed to update rating: ${err.message}`,
			code: 'recipe.msg.ratingUpdateFail'
		})
	}
}
