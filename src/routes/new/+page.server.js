import { redirect } from '@sveltejs/kit'
import { OPENAI_API_KEY, OPENAI_API_ENABLED } from '$env/static/private'

export const load = async ({ locals }) => {
	const session = await locals.auth.validate()

	if (!session && !session.user) {
		redirect(302, '/login')
	}

	return {
		apiKeyPresent: !!OPENAI_API_KEY,
		aiEnabled: OPENAI_API_ENABLED === 'true'
	}
}
