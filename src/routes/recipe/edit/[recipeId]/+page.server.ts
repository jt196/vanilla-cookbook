import type { Actions, PageServerLoad } from './$types'
import { prisma } from '$lib/server/prisma'
import { error, fail, redirect } from '@sveltejs/kit'

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

		const {
			name,
			description,
			source,
			source_url,
			cook_time,
			image_url,
			prep_time,
			ingredients,
			directions,
			total_time,
			servings,
			nutritional_info
		} = Object.fromEntries(await request.formData()) as Record<string, string>

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
					description,
					source,
					source_url,
					cook_time,
					image_url,
					prep_time,
					ingredients,
					directions,
					total_time,
					servings,
					nutritional_info
				}
			})
		} catch (err) {
			console.error(err)
			return fail(500, { message: 'Could not update recipe' })
		}
		throw redirect(302, '/recipe/view/' + params.recipeId)
	}
}
