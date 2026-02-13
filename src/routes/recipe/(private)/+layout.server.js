import { requireUser } from '$lib/server/authPage'

export const load = async ({ locals, params }) => {
	const user = requireUser(locals)

	const ai = locals.site?.ai ?? {}
	const units = user?.units || 'metric'
	const language = user?.language || 'eng'

	return {
		aiEnabled: ai.enabled ?? false,
		aiProvider: ai.provider ?? null,
		aiSelectedProvider: ai.selectedProvider ?? null,
		aiSelectedProviderConfigured: ai.selectedProviderConfigured ?? false,
		isAdmin: user?.isAdmin ?? false,
		userUnits: units,
		userLanguage: language
	}
}
