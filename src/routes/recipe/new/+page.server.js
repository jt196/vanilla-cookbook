import { redirect } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'

const OPENAI_API_KEY = env.OPENAI_API_KEY
const OPENAI_API_ENABLED = env.OPENAI_API_ENABLED || 'false'

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
