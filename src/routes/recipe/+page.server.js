import { prisma } from '$lib/server/prisma'
import { error, fail, redirect } from '@sveltejs/kit'
import { buildHierarchy } from '$lib/utils/categories.js'

/**
 * Server-side logic to load recipes for the page.
 * @returns {Promise<Object>} An object containing the recipes ordered by their creation date in descending order.
 */
export const load = async () => {
	const recipes = await prisma.recipe.findMany({
		orderBy: {
			created: 'desc'
		},
		include: {
			categories: {
				select: {
					category: {
						select: {
							name: true,
							uid: true
						}
					}
				}
			}
		}
	})

	const categories = await prisma.category.findMany()
	const hierarchicalCategories = buildHierarchy(categories)

	return {
		recipes,
		categories: hierarchicalCategories
	}
}

/**
 * Server-side actions related to recipes.
 * @namespace
 */
export const actions = {
	/**
	 * Delete a specific recipe.
	 * @param {Object} context - The context for the action.
	 * @param {URL} context.url - The URL containing the uid of the recipe to be deleted.
	 * @param {AppLocals} context.locals - The local context which includes authentication data.
	 * @returns {Promise<Object>} An object representing the result of the deletion.
	 */
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
