/**
 * Authentication utility functions.
 */
import { auth } from '$lib/server/lucia'
import { prisma } from '$lib/server/prisma'

/**
 * Helper functions for SvelteKit.
 */
import { fail, redirect } from '@sveltejs/kit'

/**
 * Represents a key-value pair from the form data.
 * @typedef {Object} FormDataEntry
 * @property {string} key
 * @property {string} value
 */

/**
 * Represents the request object.
 * @typedef {Object} Request
 * @property {function(): Promise<Array<FormDataEntry>>} formData - A function returning form data as key-value pairs.
 */

/**
 * Checks if a session is active and redirects if it is.
 * @async
 * @function
 * @param {Object} locals - The context object with authentication data.
 * @throws {redirect} Redirects to root if a session is active.
 */
export const load = async ({ locals }) => {
	const session = await locals.auth.validate()
	const settings = await prisma.siteSettings.findFirst()
	if (session) {
		redirect(302, '/');
	}
	if (!settings.registrationAllowed) {
		redirect(302, '/login');
	}
}

/**
 * Contains actions related to user registration and login.
 */
export const actions = {
	/**
	 * Registers a new user.
	 * @async
	 * @function
	 * @param {Object} context - The action's context.
	 * @param {Request} context.request - The request object containing user data.
	 * @throws {redirect} Redirects to login page after successful registration.
	 * @returns {Object} Failure response if there's an error during registration.
	 */
	default: async ({ request }) => {
		const formData = await request.formData()
		const data = Object.fromEntries(formData)
		const { name, username, password, about, email } = data

		try {
			await auth.createUser({
				key: {
					providerId: 'username',
					providerUserId: username,
					password
				},
				attributes: {
					name,
					username,
					about,
					email,
					isAdmin: false
				}
			})
		} catch (err) {
			console.error(err)
			return fail(400, { message: 'Could not register user' })
		}
		redirect(302, '/login');
	}
}
