import { getBackupInfo } from '$lib/server/backups'

export const load = async ({ parent, locals }) => {
	// Get parent data (settings, user)
	const parentData = await parent()

	// Get AI config from hooks (includes DB settings + available providers)
	const ai = locals.site?.ai ?? {
		enabled: false,
		hasAnyApiKey: false,
		availableProviders: [],
		provider: null,
		textModel: null,
		imageModel: null,
		imageAllowed: false
	}

	// Get the raw DB settings for the form
	const dbSettings = locals.site?.settings ?? {}

	// OAuth config for conditional OIDC toggle
	const oauth = locals.site?.oauth ?? { oidcEnabled: false }

	const llmConfig = {
		enabled: ai.enabled,
		hasAnyApiKey: ai.hasAnyApiKey,
		availableProviders: ai.availableProviders,
		provider: ai.provider,
		textModel: ai.textModel,
		imageModel: ai.imageModel,
		imageAllowed: ai.imageAllowed,
		// DB values for form binding
		dbEnabled: dbSettings.llmEnabled ?? false,
		dbProvider: dbSettings.llmProvider ?? null,
		dbTextModel: dbSettings.llmTextModel ?? null,
		dbImageModel: dbSettings.llmImageModel ?? null
	}

	try {
		const backupInfo = await getBackupInfo()
		return {
			...parentData,
			backupInfo,
			llmConfig,
			oauth
		}
	} catch (error) {
		console.error('Failed to load backup information:', error)
		return {
			...parentData,
			backupInfo: null,
			backupError: `Failed to load backup information: ${error.message}`,
			llmConfig,
			oauth
		}
	}
}
