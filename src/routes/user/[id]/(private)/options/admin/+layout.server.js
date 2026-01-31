import { requireAdminUser } from '$lib/server/authPage'

export const load = async ({ locals }) => {
	const user = requireAdminUser(locals)

	// Settings are placed on locals.site in hooks; provide a safe fallback.
	const settings = locals.site?.settings ?? { registrationAllowed: false }

	return { settings, user }
}
