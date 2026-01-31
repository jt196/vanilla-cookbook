import { prisma } from '$lib/server/prisma'
import { error } from '@sveltejs/kit'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function GET({ params, locals }) {
	const user = requireAuth(locals)
	const { id } = params

	if (user.userId !== id) {
		throw error(403, 'Unauthorized to view recipe logs')
	}

	try {
		const recipeLogs = await prisma.recipeLog.findMany({
			where: {
				userId: id
			},
			select: {
				id: true,
				cooked: true,
				cookedEnd: true,
				recipeUid: true,
				recipe: {
					select: {
						name: true,
						uid: true
					}
				}
			}
		})

		return jsonSuccess(recipeLogs)
	} catch (err) {
		console.error(err)
		return jsonError(500, 'Failed to fetch recipe logs.')
	}
}
