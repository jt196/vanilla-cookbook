import { redirect } from '@sveltejs/kit'

// eslint-disable-next-line no-unused-vars
export const load = async ({ locals }) => {
	const session = await locals.auth.validate()
	if (!session) {
		throw redirect(302, `/login`)
	}
	const user = session?.user
	if (user.userId) {
		throw redirect(302, `/user/${user.userId}/recipes`)
	}
}
