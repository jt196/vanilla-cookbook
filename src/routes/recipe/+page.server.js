import { prisma } from '$lib/server/prisma'
import { error } from '@sveltejs/kit'

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
