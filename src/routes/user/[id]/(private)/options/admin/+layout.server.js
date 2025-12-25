import { error } from '@sveltejs/kit'

export const load = async ({ locals }) => {
	const user = locals.user

	if (!user.isAdmin) {
		error(403, 'Forbidden')
	}

	// Settings are placed on locals.site in hooks; provide a safe fallback.
	const settings = locals.site?.settings ?? { registrationAllowed: false }

	return { settings, user }
}
