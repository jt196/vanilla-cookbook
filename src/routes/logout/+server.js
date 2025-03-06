import { auth } from '$lib/server/lucia'
import { redirect } from '@sveltejs/kit'

/**
 * Handles POST requests and manages session validation and invalidation.
 *
 * @function
 * @async
 * @param {Object} context - The context of the request.
 * @param {AppLocals} context.locals - The locals object.
 * @throws Will redirect if the session is not valid or after session invalidation.
 * @returns {Promise<void>}
 */
export const POST = async ({ locals }) => {
	const session = await locals.auth.validate()
	if (!session) {
		redirect(302, '/');
	}

	await auth.invalidateSession(session.sessionId)
	locals.auth.setSession(null)

	redirect(302, '/');
}
