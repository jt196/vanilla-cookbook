export const load = async ({ locals }) => {
	const ai = locals.site?.ai ?? {}
	const units = locals.user?.units || 'metric'
	const language = locals.user?.language || 'eng'

	return {
		apiKeyPresent: ai.hasAnyApiKey ?? false,
		aiEnabled: ai.enabled ?? false,
		aiProvider: ai.provider ?? null,
		aiSelectedProvider: ai.selectedProvider ?? null,
		aiSelectedProviderConfigured: ai.selectedProviderConfigured ?? false,
		isAdmin: locals.user?.isAdmin ?? false,
		imageAllowed: ai.imageAllowed ?? false,
		userPublicRecipes: locals.user?.publicRecipes ?? false,
		userUnits: units,
		userLanguage: language
	}
}
