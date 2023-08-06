import type { Actions, PageServerLoad } from './$types'
import { prisma } from '$lib/server/prisma'
import { fail, redirect } from '@sveltejs/kit'

export const load: PageServerLoad = async () => {
	return {
		recipes: await prisma.recipe.findMany()
	}
}

export const actions: Actions = {
	createRecipe: async ({ request, locals }) => {
		const { session, user } = await locals.auth.validateUser()
		if (!session || !user) {
			throw redirect(302, '/')
		}

		const { name, description } = Object.fromEntries(await request.formData()) as Record<
			string,
			string
		>

		try {
			await prisma.recipe.create({
				data: {
					name,
					description,
					created: new Date(),
					userId: user.userId
				}
			})
		} catch (err) {
			console.error(err)
			return fail(500, { message: 'Could not create the recipe.' })
		}
		throw redirect(302, '/recipe')
	}
}
