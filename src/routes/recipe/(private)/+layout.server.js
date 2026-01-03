import { redirect } from '@sveltejs/kit'

export const load = async ({ locals, params }) => {
	const user = locals.user
	if (!user) {
		throw redirect(302, '/login')
	}

	const ai = locals.site.ai
	const units = locals.user?.units || 'metric'
	const language = locals.user?.language || 'eng'

	return {
		aiEnabled: ai.aiEnabled,
		userUnits: units,
		userLanguage: language
	}
}
