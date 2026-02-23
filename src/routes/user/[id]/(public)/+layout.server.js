import { redirect } from '@sveltejs/kit'

/**
 * Server-side logic to load recipes for the page.
 * @returns {Promise<Object>} An object containing the recipes ordered by their creation date in descending order.
 */
export const load = async ({ params, url, fetch, locals }) => {
	const user = locals.user
	const requestedUserId = params.id

	// First fetch user profile to check access (required before other fetches)
	const userPublicResponse = await fetch(`/api/user/${requestedUserId}/public`)
	const userPublic = await userPublicResponse.json()

	if (!userPublic.userProfile.publicProfile && !user?.isAdmin && user?.userId !== requestedUserId) {
		throw redirect(302, '/recipes')
	}

	const recipes = await fetch(`/api/user/${requestedUserId}/recipes`).then((r) => r.json())

	return {
		recipes,
		semanticAvailable: !!locals.site?.semantic?.enabled,
		user: {
			requestedUserId: requestedUserId,
			viewingUserId: user?.userId ?? null,
			publicProfile: userPublic.userProfile
		}
	}
}
