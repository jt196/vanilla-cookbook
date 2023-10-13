import { redirect } from '@sveltejs/kit'

/**
 * Server-side logic to load recipes for the page.
 * @returns {Promise<Object>} An object containing the recipes ordered by their creation date in descending order.
 */
export const load = async ({ params, url, fetch, locals }) => {
	const requestedUserId = params.id // Extracting the uid from the request parameters
	const userIsPublicResponse = await fetch(`${url.origin}/api/user/${requestedUserId}/public`)
	const userIsPublic = await userIsPublicResponse.json()
	const { session, user } = await locals.auth.validateUser()
	if (!userIsPublic.publicProfile && (!session || !user)) {
		throw redirect(302, '/login')
	}
	let viewingUserId
	let userName
	user ? ((viewingUserId = user.userId), (userName = user.name)) : (userName = userIsPublic.name)
	console.log('🚀 ~ file: +page.server.js:23 ~ load ~ userName:', userName)
	const recipeResponse = await fetch(`${url.origin}/api/user/${requestedUserId}/recipes`)
	const recipes = await recipeResponse.json()
	const hierarchicalCategories = await fetch(`${url.origin}/api/user/${requestedUserId}/categories`)
	const categories = await hierarchicalCategories.json()

	return {
		recipes,
		categories,
		user: {
			requestedUserId: requestedUserId,
			viewingUserId: viewingUserId,
			publicProfile: userIsPublic
		}
	}
}
