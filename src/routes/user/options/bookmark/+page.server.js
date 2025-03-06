import { error } from '@sveltejs/kit'

// eslint-disable-next-line no-unused-vars
export const load = async ({ url, fetch, locals }) => {
	const session = await locals.auth.validate()
	const user = session?.user

	if (!session || !session.user) {
		error(401, 'Unauthorized');
	}

	return { user }
}
