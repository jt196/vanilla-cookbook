// src/routes/user/+layout.server.js
import { prisma } from '$lib/server/prisma'
import { requireUser, requireUserMatch } from '$lib/server/authPage'

export const load = async ({ locals, params }) => {
	const id = params.id
	const user = requireUser(locals)
	requireUserMatch(user, id)
	let dbRecordCount = await prisma.recipe.count({ where: { userId: user.userId } })
	return { user, dbRecordCount, version: process.env.GIT_VERSION || 'Dev Version' }
}
