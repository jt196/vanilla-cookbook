import { prisma } from '$lib/server/prisma'

/**
 * Validates the current user's authentication status and returns user data.
 * @async
 * @function
 * @param {Object} locals - The context object containing authentication data.
 * @returns {Object} Returns the authenticated user object.
 */

export const load = async ({ locals }) => {
	try {
		const session = await locals.auth.validate()
		const settings = await prisma.siteSettings.findFirst()
		if (!session) {
			return { user: null, settings }
		}
		const user = session?.user
		return {
			user,
			settings
		}
	} catch (error) {
		console.error('Error validating session:', error)
		// Handle error appropriately, such as returning a minimal response or redirecting
		return { user: null, settings: null }
	}
}
