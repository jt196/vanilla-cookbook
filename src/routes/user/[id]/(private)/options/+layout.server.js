import { requireUser } from '$lib/server/authPage'

/**
 * Options pages: requires login and provides the user and current path for the options
 * menu.
 *
 * @type {import('./$types').LayoutServerLoad}
 */
export const load = async ({ url, locals }) => {
	const user = requireUser(locals)
	return { user, pathname: url.pathname }
}
