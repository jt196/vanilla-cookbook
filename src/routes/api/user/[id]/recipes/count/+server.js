import { error } from '@sveltejs/kit'
import { prisma } from '$lib/server/prisma'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function GET({ params, locals }) {
	const { id } = params
	const user = requireAuth(locals)

	if (user.userId !== id) {
		throw error(403, 'Unauthorized to view recipes count')
	}

	try {
		const count = await prisma.Recipe.count({
			where: { userId: user.userId }
		})

		return jsonSuccess({ count })
	} catch (err) {
		console.error('Error counting recipes:', err)
		return jsonError(500, {
			error: 'Internal server error.',
			code: 'users.msg.countLoadFail'
		})
	}
}
