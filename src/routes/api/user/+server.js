import { auth } from '$lib/server/lucia'
import { prisma } from '$lib/server/prisma'
import { validatePassword } from '$lib/utils/security.js'
import { seedRecipes } from '$lib/utils/seed/seedHelpers'
import { requireAdmin, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { env } from '$env/dynamic/private'

/**
 * Handles the POST request to create a new user.
 *
 * Validates the current user's authentication and admin status. It expects a JSON
 * body with user data. It validates the password and creates a new user if all
 * conditions are met.
 *
 * @async
 * @function
 * @param {Object} request - The request object containing user data.
 * @param {Object} locals - The context object containing authentication data.
 * @returns {Response} Returns a JSON response indicating success or failure.
 *
 * @throws {Error} If the user is not authenticated or not an admin, it returns
 *                 a 401 error. If the password is invalid, it returns a 400 error.
 *                 If an error occurs during user creation, it returns a 500 error.
 */
export async function POST({ request, locals }) {
	requireAdmin(locals)
	const bodyText = await request.text()
	const userData = JSON.parse(bodyText)

	const passwordValidation = validatePassword(userData.password, env)

	if (!passwordValidation.isValid) {
		return jsonError(400, passwordValidation.message)
	}

	try {
		const newUser = await auth.createUser({
			key: {
				providerId: 'username',
				providerUserId: userData.username,
				password: userData.password
			},
			attributes: {
				username: userData.username,
				about: userData.about,
				email: userData.email,
				isAdmin: userData.isAdmin
			}
		})
		if (userData.userSeed) {
			await seedRecipes(newUser.userId, prisma)
		}
		return jsonSuccess(newUser)
	} catch (err) {
		console.error(err)
		return jsonError(500, 'Failed to create user')
	}
}
