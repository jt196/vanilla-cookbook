import { auth } from '$lib/server/lucia'
import { fail, redirect } from '@sveltejs/kit'
import { prisma } from '$lib/server/prisma'

/**
 * Validates if the user is logged in and redirects if necessary.
 *
 * @param {Object} context - The context object.
 * @param {AppLocals} context.locals - Local variables.
 */
export const load = async ({ locals }) => {
	const session = await locals.auth.validate()
	const settings = await prisma.siteSettings.findFirst()
	if (session) {
		throw redirect(302, '/')
	}
	return { settings }
}

/**
 * Actions related to login, such as default login.
 *
 * @type {Object}
 */
export const actions = {
	/**
	 * Default action to authenticate the user based on provided credentials.
	 *
	 * @param {Object} context - The context object.
	 * @param {Object} context.request - The request data.
	 * @param {AppLocals} context.locals - Local variables.
	 * @returns {void} Throws a redirect or failure based on authentication result.
	 */
	default: async ({ request, locals }) => {
		const formData = Object.fromEntries(await request.formData())
		const { username, password } = /** @type {Record<string, string>} */ (formData)

		try {
			const key = await auth.useKey('username', username, password)
			const session = await auth.createSession(key.userId)
			locals.auth.setSession(session)
		} catch (err) {
			console.error(err)
			return fail(400, { message: 'Could not login user.' })
		}
		throw redirect(302, '/')
	}
}
