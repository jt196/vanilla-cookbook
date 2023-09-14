import { prisma } from '$lib/server/prisma'
import { error, fail, redirect } from '@sveltejs/kit'

/**
 * Handles loading the page data.
 *
 * @function
 * @async
 * @param {Object} context - The context of the load.
 * @param {Object} context.params - Parameters of the request.
 * @param {AppLocals} context.locals - The locals object.
 * @throws Will throw an error if unauthorized or the recipe is not found.
 * @returns {Promise<{ recipe: Object }>} The loaded recipe.
 */
export const load = async ({ url, params, locals, fetch }) => {
	const { user } = await locals.auth.validateUser()

	let recipeData = await fetch(`${url.origin}/api/recipe/${params.recipeId}`)
	const recipe = await recipeData.json()

	const hierarchicalCategories = await fetch(
		`${url.origin}/api/recipe/categories/user/${user.userId}`
	)
	const categories = await hierarchicalCategories.json()

	return {
		recipe,
		allCategories: categories
	}
}

/**
 * Actions for the page.
 *
 * @namespace
 */
export const actions = {
	/**
	 * Handles updating the recipe.
	 *
	 * @function
	 * @async
	 * @param {Object} context - The context of the action.
	 * @param {Object} context.request - The request object.
	 * @param {Object} context.params - Parameters of the request.
	 * @param {AppLocals} context.locals - The locals object.
	 * @throws Will throw an error if unauthorized, forbidden, or on failure.
	 * @returns {Promise<{ status?: number, location?: string }>}
	 */
	updateRecipe: async ({ request, params, locals }) => {
		const { session, user } = await locals.auth.validateUser()
		if (!session || !user) {
			throw error(401, 'Unauthorized')
		}
		const formData = await request.formData()
		const entries = [...formData.entries()]

		let recipeCategories = []
		const data = {}

		for (const [key, value] of entries) {
			if (key === 'categories[]') {
				recipeCategories.push(value)
			} else {
				data[key] = value
			}
		}

		const {
			name,
			description,
			source,
			rating,
			source_url,
			cook_time,
			image_url,
			prep_time,
			ingredients,
			directions,
			total_time,
			servings,
			nutritional_info
		} = data

		// Convert rating to float
		const floatRating = parseFloat(rating)

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
					rating: floatRating,
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
			// First, remove all existing associations
			await prisma.recipeCategory.deleteMany({
				where: {
					recipeUid: params.recipeId
				}
			})

			// Then, add the new associations
			for (let categoryUid of recipeCategories) {
				await prisma.recipeCategory.create({
					data: {
						recipeUid: params.recipeId,
						categoryUid: categoryUid
					}
				})
			}
		} catch (err) {
			console.error(err)
			return fail(500, { message: 'Could not update recipe' })
		}
		throw redirect(302, '/recipe/view/' + params.recipeId)
	}
}
