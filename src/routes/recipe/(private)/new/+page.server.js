export const load = async ({ locals }) => {
	const ai = locals.site.ai
	const units = locals.user?.units || 'metric'

	return {
		apiKeyPresent: ai.apiKeyPresent,
		aiEnabled: ai.aiEnabled,
		imageAllowed: ai.imageAllowed,
		userUnits: units
	}
}
