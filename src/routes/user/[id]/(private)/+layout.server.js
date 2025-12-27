// src/routes/user/+layout.server.js
import { prisma } from '$lib/server/prisma'
import { redirect } from '@sveltejs/kit'

export const load = async ({ locals, params }) => {
	const user = locals.user
	const id = params.id
	if (!user) {
		throw redirect(302, '/login')
	}
	if (user.userId !== id) {
		throw redirect(302, '/')
	}
	let dbRecordCount = await prisma.recipe.count({ where: { userId: user.userId } })
	return { user, dbRecordCount, version: process.env.GIT_VERSION || 'Dev Version' }
}
