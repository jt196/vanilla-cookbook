import { auth } from '$lib/server/lucia'
import { redirect } from '@sveltejs/kit'

/**
 * Log out: invalidate the current session and clear the cookie, then redirect home.
 *
 * @type {import('./$types').RequestHandler}
 */
export const POST = async ({ locals }) => {
	const session = await locals.auth.validate()
	if (!session) {
		throw redirect(302, '/')
	}

	await auth.invalidateSession(session.sessionId)
	locals.auth.setSession(null)

	throw redirect(302, '/')
}
