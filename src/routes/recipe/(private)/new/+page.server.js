export const load = async ({ locals }) => {
	const ai = locals.site.ai
	const units = locals.user?.units || 'metric'
	const language = locals.user?.language || 'eng'

	return {
		apiKeyPresent: ai.apiKeyPresent,
		aiEnabled: ai.aiEnabled,
		imageAllowed: ai.imageAllowed,
		userUnits: units,
		userLanguage: language
	}
}
