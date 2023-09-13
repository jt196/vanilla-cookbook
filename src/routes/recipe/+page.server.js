import { prisma } from '$lib/server/prisma'
import { error, fail, redirect } from '@sveltejs/kit'
import path from 'path'
import { promises as fsPromises } from 'fs'

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

			// 1. Fetch the associated RecipePhoto entries for the recipe
			const photos = await prisma.recipePhoto.findMany({
				where: {
					recipeUid: uid
				}
			})

			// 2. Delete the images from the file system
			for (const photo of photos) {
				const photoPath = path.join('static/recipe_photos/', photo.id + '.' + photo.fileType)
				try {
					await fsPromises.unlink(photoPath)
				} catch (err) {
					console.error(`Failed to delete photo at ${photoPath}`, err)
				}
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
