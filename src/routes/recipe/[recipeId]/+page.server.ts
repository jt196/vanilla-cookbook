import type { Actions, PageServerLoad } from './$types'
import { prisma } from '$lib/server/prisma'
import { error, fail } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, locals }) => {
	const { session, user } = await locals.auth.validateUser()
	if (!session || !user) {
		throw error(401, 'Unauthorized')
	}

	const getRecipe = async (userId: string) => {
		const recipe = await prisma.recipe.findUnique({
			where: {
				uid: params.recipeId
			}
		})
		if (!recipe) {
			throw error(404, 'recipe not found')
		}
		if (recipe.userId !== user.userId) {
			throw error(403, 'Unauthorized')
		}

		return recipe
	}

	return {
		recipe: getRecipe(user.userId)
	}
}

export const actions: Actions = {
	updateRecipe: async ({ request, params, locals }) => {
		const { session, user } = await locals.auth.validateUser()
		if (!session || !user) {
			throw error(401, 'Unauthorized')
		}

		const { name, description } = Object.fromEntries(await request.formData()) as Record<
			string,
			string
		>

		console.log('🚀 ~ file: +page.server.ts:41 ~ updateRecipe: ~ description:', description)
		console.log('🚀 ~ file: +page.server.ts:41 ~ updateRecipe: ~ name:', name)
		console.log('🚀 ~ file: +page.server.ts:15 ~ getRecipe ~ uid: updating: ', params.recipeId)
		try {
			const recipe = await prisma.recipe.findUniqueOrThrow({
				where: {
					uid: params.recipeId
				}
			})

			if (recipe.userId !== user.userId) {
				throw error(403, 'Forbidden to edit this recipe.')
			}
			await prisma.recipe.update({
				where: {
					uid: params.recipeId
				},
				data: {
					name,
					description
				}
			})
		} catch (err) {
			console.error(err)
			return fail(500, { message: 'Could not update recipe' })
		}

		return {
			status: 200
		}
	}
}
