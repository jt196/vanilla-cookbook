import { auth } from '$lib/server/lucia'
import { fail, redirect } from '@sveltejs/kit'
import { prisma } from '$lib/server/prisma'
import { dbSeeded } from '$lib/utils/seed/seedHelpers'

/**
 * Validates if the user is logged in and redirects if necessary.
 *
 * @param {Object} context - The context object.
 * @param {AppLocals} context.locals - Local variables.
 */
export const load = async ({ locals, url }) => {
	const session = await locals.auth.validate()
	const user = session?.user
	const dbSeed = await dbSeeded(prisma)
	if (dbSeed) {
		const settings = await prisma.siteSettings.findFirst()
		if (session) {
			redirect(302, '/user/' + user.userId + '/recipes')
		}
		// Capture form failure messages from query parameters (SSR safe)
		const form = {
			message: url.searchParams.get('message') ?? null
		}

		const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
		const githubEnabled = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
		
		return {
			settings,
			form,
			oauthEnabled: googleEnabled || githubEnabled,
			googleEnabled,
			githubEnabled
		}
	} else {
		redirect(302, '/')
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
		redirect(302, '/')
	}
}
