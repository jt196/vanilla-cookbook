import { redirect } from '@sveltejs/kit'

/**
 * Server-side logic to load recipes for the page.
 * @returns {Promise<Object>} An object containing the recipes ordered by their creation date in descending order.
 */
export const load = async ({ params, url, fetch, locals }) => {
	const { session, user } = await locals.auth.validateUser()
	if (!session || !user) {
		throw redirect(302, '/login')
	}
	const requestedUserId = params.id // Extracting the uid from the request parameters
	console.log('🚀 ~ file: +page.server.js:13 ~ load ~ requestedUserId:', requestedUserId)
	console.log('🚀 ~ file: +page.server.js:26 ~ load ~ user.userId:', user.userId)

	const recipeResponse = await fetch(`${url.origin}/api/user/${requestedUserId}/recipes`)
	const recipes = await recipeResponse.json()
	const hierarchicalCategories = await fetch(`${url.origin}/api/user/${requestedUserId}/categories`)
	const categories = await hierarchicalCategories.json()

	return {
		recipes,
		categories,
		user: {
			requestedUserId: requestedUserId,
			viewingUserId: user.userId
		}
	}
}
