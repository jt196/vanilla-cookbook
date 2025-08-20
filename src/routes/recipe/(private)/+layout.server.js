import { redirect } from '@sveltejs/kit'

export const load = async ({ locals, params }) => {
	const user = locals.user
	if (!user) {
		throw redirect(302, '/login')
	}
	return {}
}
