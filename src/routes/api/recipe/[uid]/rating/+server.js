import { prisma } from '$lib/server/prisma'
import { requireAuth, requireOwnership, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function PUT({ request, locals, params }) {
	const user = requireAuth(locals)
	const { uid } = params

	try {
		const { rating } = await request.json()
		if (rating !== null && !(Number.isFinite(rating) && rating >= 0 && rating <= 5)) {
			return jsonError(400, {
				error: 'Rating must be between 0 and 5.',
				code: 'recipe.msg.ratingUpdateFail'
			})
		}

		const recipe = await prisma.recipe.findUnique({ where: { uid }, select: { userId: true } })
		requireOwnership(user, recipe)

		await prisma.recipe.update({ where: { uid }, data: { rating } })
		return jsonSuccess({ message: 'Rating updated', code: 'recipe.msg.ratingUpdated', rating })
	} catch (err) {
		if (err.status) throw err
		return jsonError(500, {
			error: `Failed to update rating: ${err.message}`,
			code: 'recipe.msg.ratingUpdateFail'
		})
	}
}
