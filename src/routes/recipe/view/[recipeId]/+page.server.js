import { prisma } from '$lib/server/prisma'
import { error, fail, redirect } from '@sveltejs/kit'

/**
 * Loads the recipe data.
 *
 * @function load
 * @param {Object} context - The loading context.
 * @param {Object} context.params - The route parameters.
 * @param {AppLocals} context.locals - The local variables.
 * @returns {Promise<Object>} The loaded recipe data.
 * @async
 */
export const load = async ({ params, locals, fetch, url }) => {
	const { session, user } = await locals.auth.validateUser()
	if (!session || !user) {
		throw error(401, 'Unauthorized')
	}

	/**
	 * Fetches the recipe for a given user ID.
	 *
	 * @param {string} userId - The ID of the user.
	 * @returns {Promise<Object>} The recipe data.
	 * @throws {Error} If the recipe is not found or unauthorized.
	 * @async
	 */
	const getRecipe = async () => {
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

	let recipeCategories = await fetch(`${url.origin}/api/recipe/categories/${params.recipeId}`)
	const categories = await recipeCategories.json()
	console.log('🚀 ~ file: +page.server.js:48 ~ load ~ categories:', categories)

	return {
		recipe: getRecipe(),
		categories
	}
}

/**
 * Recipe actions object.
 *
 * @typedef {Object} Actions
 * @property {Function} updateRecipe - The function to update the recipe.
 */

/**
 * The actions for managing recipes.
 *
 * @type {Actions}
 */
export const actions = {
	updateRecipe: async ({ request, params, locals }) => {
		const { session, user } = await locals.auth.validateUser()
		if (!session || !user) {
			throw error(401, 'Unauthorized')
		}

		const { name, description } = Object.fromEntries(await request.formData())

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
		throw redirect(302, '/recipe')
	}
}
