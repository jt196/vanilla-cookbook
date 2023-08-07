import type { Actions, PageServerLoad } from './$types'
import { prisma } from '$lib/server/prisma'
import { error, fail, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async () => {
	return {
		recipes: await prisma.recipe.findMany({
			orderBy: {
				created: 'desc'
			}
		})
	}
}

export const actions: Actions = {
	deleteRecipe: async ({ url, locals }) => {
		const { session, user } = await locals.auth.validateUser()
		if (!session || !user) {
			throw redirect(302, '/')
		}
		const uid = url.searchParams.get('uid')
		if (!uid) {
			return fail(400, { message: 'Invalid request' })
		}

		try {
			const recipe = await prisma.recipe.findUniqueOrThrow({
				where: {
					uid
				}
			})

			if (recipe.userId !== user.userId) {
				throw error(403, 'Not authorized')
			}

			await prisma.recipe.delete({
				where: {
					uid
				}
			})
		} catch (err) {
			console.error(err)
			return fail(500, {
				message: 'Something went wrong deleting your recipe'
			})
		}

		return {
			status: 200
		}
	}
}
