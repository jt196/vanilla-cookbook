import type { Actions, PageServerLoad } from './$types'
import { prisma } from '$lib/server/prisma'
import { error, fail, redirect } from '@sveltejs/kit'

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

		const { title, content } = Object.fromEntries(await request.formData()) as Record<
			string,
			string
		>

		try {
			await prisma.recipe.create({
				data: {
					title,
					content,
					userId: user.userId
				}
			})
		} catch (err) {
			console.error(err)
			return fail(500, { message: 'Could not create the recipe.' })
		}

		return {
			status: 201
		}
	},
	deleteRecipe: async ({ url, locals }) => {
		const { session, user } = await locals.auth.validateUser()
		if (!session || !user) {
			throw redirect(302, '/')
		}
		const id = url.searchParams.get('id')
		if (!id) {
			return fail(400, { message: 'Invalid request' })
		}

		try {
			const recipe = await prisma.recipe.findUniqueOrThrow({
				where: {
					id: Number(id)
				}
			})

			if (recipe.userId !== user.userId) {
				throw error(403, 'Not authorized')
			}

			await prisma.recipe.delete({
				where: {
					id: Number(id)
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
