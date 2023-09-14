import { prisma } from '$lib/server/prisma'
import { error, fail, redirect } from '@sveltejs/kit'

/**
 * Server-side logic to load recipes for the page.
 * @returns {Promise<Object>} An object containing the recipes ordered by their creation date in descending order.
 */
export const load = async ({ url, fetch, locals }) => {
	const { session, user } = await locals.auth.validateUser()
	if (!session || !user) {
		throw error(401, 'Unauthorized')
	}
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
			},
			photos: {
				where: {
					isMain: true
				},
				select: {
					id: true, // or whatever fields you need
					fileType: true
				}
			}
		}
	})

	const hierarchicalCategories = await fetch(
		`${url.origin}/api/recipe/categories/user/${user.userId}`
	)
	const categories = await hierarchicalCategories.json()

	return {
		recipes,
		categories
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
		console.log('🚀 ~ file: +page.server.js:65 ~ deleteRecipe: ~ session:', session)
		console.log('🚀 ~ file: +page.server.js:65 ~ deleteRecipe: ~ user:', user)
		if (!session || !user) {
			throw redirect(302, '/')
		}
		const uid = url.searchParams.get('uid')
		console.log('🚀 ~ file: +page.server.js:69 ~ deleteRecipe: ~ uid:', uid)
		if (!uid) {
			return fail(400, { message: 'Invalid request' })
		}

		try {
			const response = await fetch(`${url.origin}/api/recipe/${uid}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Failed to delete recipe')
			}

			return {
				status: 200
			}
		} catch (err) {
			console.error(err)
			return fail(500, {
				message: 'Something went wrong deleting your recipe'
			})
		}
	}
}
