import { auth } from '$lib/server/lucia'
import { fail, redirect } from '@sveltejs/kit'
import {
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET
} from '$env/static/private'

/**
 * Validates if the user is logged in and redirects if necessary.
 *
 * @param {Object} context - The context object.
 * @param {AppLocals} context.locals - Local variables.
 */
export const load = async ({ locals, url }) => {
	const user = locals.user
	const { settings, oauth } = locals.site
	if (user) {
		throw redirect(302, '/')
	}
	// Capture form failure messages from query parameters (SSR safe)
	const form = {
		message: url.searchParams.get('message') ?? null
	}

	return {
		settings,
		oauth,
		form
	}
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

		if (!username || !password) {
			return fail(400, { message: 'Missing username or password.' })
		}

		try {
			const key = await auth.useKey('username', username, password)
			// const session = await auth.createSession(key.userId)
			const session = await auth.createSession({
				userId: key.userId,
				attributes: {}
			})
			locals.auth.setSession(session)
		} catch (err) {
			console.error(err)
			console.error(err.message)
			if (err.message === 'AUTH_INVALID_PASSWORD') {
				console.log('Invalid Password')
				return fail(400, { message: 'Incorrect Password!' })
			} else if (err.message === 'AUTH_INVALID_KEY_ID') {
				console.log('Non-existent Username')
				return fail(400, { message: "User Doesn't Exist!" })
			}
			return fail(400, { message: 'Could not login user.' })
		}
		throw redirect(302, '/')
	}
}
