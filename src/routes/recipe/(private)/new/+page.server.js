export const load = async ({ locals }) => {
	const ai = locals.site?.ai ?? {}
	const units = locals.user?.units || 'metric'
	const language = locals.user?.language || 'eng'

	return {
		apiKeyPresent: ai.hasAnyApiKey ?? false,
		aiEnabled: ai.enabled ?? false,
		imageAllowed: ai.imageAllowed ?? false,
		userUnits: units,
		userLanguage: language
	}
}
