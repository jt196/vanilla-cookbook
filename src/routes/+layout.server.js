import { prisma } from '$lib/server/prisma'
import { dbSeeded } from '$lib/utils/seedHelpers'

/**
 * Validates the current user's authentication status and returns user data.
 * @async
 * @function
 * @param {Object} locals - The context object containing authentication data.
 * @returns {Object} Returns the authenticated user object.
 */

export const load = async ({ locals }) => {
	// Check if the SQLite database file exists
	const dbSeed = await dbSeeded(prisma)
	console.log('Loading layout...')

	// If the database exists, validate the session and redirect accordingly.
	if (dbSeed) {
		console.log('DB is seeded!')
		try {
			const session = await locals.auth.validate()
			const settings = await prisma.siteSettings.findFirst()
			if (!session) {
				return { user: null, settings }
			}
			const user = session?.user
			return {
				user,
				settings,
				dbSeed
			}
		} catch (error) {
			console.error('Error validating session:', error)
			// Handle error appropriately, such as returning a minimal response or redirecting
			return { user: null, settings: { registrationAllowed: false } }
		}
	} else {
		// throw redirect(302, '/')
		return { user: null, settings: { registrationAllowed: false } }
	}
}
