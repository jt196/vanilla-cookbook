import { auth } from '$lib/server/lucia'
import { prisma } from '$lib/server/prisma'
import { validatePassword } from '$lib/utils/security.js'
import { seedRecipes } from '$lib/utils/seed/seedHelpers'

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
export const POST = async ({ request, locals }) => {
	const session = await locals.auth.validate()
	const user = session?.user
	const bodyText = await request.text()
	const userData = JSON.parse(bodyText)

	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	// Ensure the user is an admin
	if (!user.isAdmin) {
		return new Response(
			JSON.stringify({ error: 'Unauthorized! You must be an admin to create users.' }),
			{
				status: 401,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}

	const passwordValidation = validatePassword(userData.password)

	if (!passwordValidation.isValid) {
		return new Response(JSON.stringify({ error: passwordValidation.message }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		const newUser = await auth.createUser({
			key: {
				providerId: 'username',
				providerUserId: userData.username,
				password: userData.password
			},
			attributes: {
				name: userData.name,
				username: userData.username,
				about: userData.about,
				email: userData.email,
				isAdmin: userData.isAdmin
			}
		})
		if (userData.userSeed) {
			await seedRecipes(newUser.userId, prisma)
		}
		return new Response(JSON.stringify(newUser), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (err) {
		console.error(err)
		return new Response(JSON.stringify({ error: `Failed to update user` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
