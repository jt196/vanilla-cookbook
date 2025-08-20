import { error } from '@sveltejs/kit'

export const load = async ({ locals }) => {
	const user = locals.user

	if (!user.isAdmin) {
		error(403, 'Forbidden')
	}

	const settings = locals.settings

	return { settings, user }
}
