/**
 * Server-side logic to load recipes for the page.
 * @returns {Promise<Object>} An object containing the recipes ordered by their creation date in descending order.
 */
export const load = async ({ params, url, fetch, locals }) => {
	const user = locals.user
	const requestedUserId = params.id

	const userPublicResponse = await fetch(`${url.origin}/api/user/${requestedUserId}/public`)
	const userPublic = await userPublicResponse.json()

	if (!userPublic.userProfile.publicProfile && !user?.isAdmin && user?.userId !== requestedUserId) {
		throw redirect(302, '/users')
	}

	let viewingUserId
	user ? (viewingUserId = user.userId) : null
	const recipeResponse = await fetch(`${url.origin}/api/user/${requestedUserId}/recipes`)
	const recipes = await recipeResponse.json()
	const hierarchicalCategories = await fetch(`${url.origin}/api/user/${requestedUserId}/categories`)
	const categories = await hierarchicalCategories.json()

	return {
		recipes,
		categories,
		user: {
			requestedUserId: requestedUserId,
			viewingUserId,
			publicProfile: userPublic.userProfile
		}
	}
}
