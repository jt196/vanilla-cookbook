import { requireAdminUser } from '$lib/server/authPage'

/**
 * Admin options pages: requires an admin and provides the site settings.
 *
 * @type {import('./$types').LayoutServerLoad}
 */
export const load = async ({ locals }) => {
	const user = requireAdminUser(locals)

	// Settings are placed on locals.site in hooks; provide a safe fallback.
	const settings = locals.site?.settings ?? { registrationAllowed: false, requireLogin: false }

	return { settings, user }
}
