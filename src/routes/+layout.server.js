import { prisma } from '$lib/server/prisma'

/**
 * Validates the current user's authentication status and returns user data.
 * @async
 * @function
 * @param {Object} locals - The context object containing authentication data.
 * @returns {Object} Returns the authenticated user object.
 */
export const load = async ({ locals }) => {
	// eslint-disable-next-line no-unused-vars
	const { session, user } = await locals.auth.validateUser()
	const settings = await prisma.siteSettings.findFirst()
	return { user, settings }
}
