import { redirect } from '@sveltejs/kit'

export const load = async ({ locals }) => {
	const session = await locals.auth.validate()

	if (!session && !session.user) {
		redirect(302, '/login')
	}
}
