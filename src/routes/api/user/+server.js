import { auth } from '$lib/server/lucia'
import { prisma } from '$lib/server/prisma'
import { validatePassword } from '$lib/utils/security.js'
import { seedRecipes } from '$lib/utils/seed/seedHelpers'
import { requireAdmin, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { env } from '$env/dynamic/private'

/**
 * Admin: create a user (username, password, email, about, admin flag), optionally seeding
 * example recipes. Validates the password against the site's rules.
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
export async function POST({ request, locals }) {
	requireAdmin(locals)
	const bodyText = await request.text()
	const userData = JSON.parse(bodyText)

	const passwordValidation = validatePassword(userData.password, env)

	if (!passwordValidation.isValid) {
		return jsonError(400, {
			error: passwordValidation.message,
			code: passwordValidation.messageCode,
			vars: passwordValidation.messageVars
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
		if (err?.code === 'P2002') {
			if (err.meta?.target?.includes('username')) {
				return jsonError(400, {
					error: 'Username already taken!',
					code: 'admin.users.msg.usernameTaken'
				})
			}
			if (err.meta?.target?.includes('email')) {
				return jsonError(400, {
					error: 'Email already taken!',
					code: 'admin.users.msg.emailTaken'
				})
			}
		}
		return jsonError(500, { error: 'Failed to create user', code: 'admin.users.msg.createFail' })
	}
}
