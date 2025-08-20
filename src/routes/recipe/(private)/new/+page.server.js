export const load = async ({ locals }) => {
	const ai = locals.site.ai

	return {
		apiKeyPresent: ai.apiKeyPresent,
		aiEnabled: ai.aiEnabled
	}
}
