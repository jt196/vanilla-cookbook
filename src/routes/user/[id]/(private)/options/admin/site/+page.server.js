import { getBackupInfo } from '$lib/server/backups'
import { prisma } from '$lib/server/prisma'

export const load = async ({ parent, locals }) => {
	// Get parent data (settings, user)
	const parentData = await parent()

	// Get AI config from hooks (includes DB settings + available providers)
	const ai = locals.site?.ai ?? {
		enabled: false,
		hasAnyApiKey: false,
		availableProviders: [],
		provider: null,
		imageProvider: null,
		textModel: null,
		imageModel: null,
		imageAllowed: false
	}
	const semantic = locals.site?.semantic ?? {
		enabled: false,
		enabledBySite: false,
		providerAvailable: false,
		provider: null
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
		imageProvider: ai.imageProvider,
		textModel: ai.textModel,
		imageModel: ai.imageModel,
		imageAllowed: ai.imageAllowed,
		// DB values for form binding
		dbEnabled: dbSettings.llmEnabled ?? false,
		dbProvider: dbSettings.llmProvider ?? null,
		dbImageProvider: dbSettings.llmImageProvider ?? null,
		dbTextModel: dbSettings.llmTextModel ?? null,
		dbImageModel: dbSettings.llmImageModel ?? null,
		dbSemanticEnabled: dbSettings.semanticEnabled ?? false,
		dbSemanticEmbeddingProvider: dbSettings.semanticEmbeddingProvider ?? null,
		dbSemanticEmbeddingModel: dbSettings.semanticEmbeddingModel ?? null,
		semanticProvider: semantic.provider,
		semanticAvailableProviders: semantic.availableProviders ?? [],
		semanticSelectedProvider: semantic.selectedProvider ?? null,
		semanticSelectedProviderConfigured: semantic.selectedProviderConfigured ?? false,
		semanticModel: semantic.model ?? null
	}

	try {
		const [backupInfo, embeddingRemaining, embeddingTotal] = await Promise.all([
			getBackupInfo(),
			prisma.recipe.count({
				where: {
					embedding: null,
					in_trash: false
				}
			}),
			prisma.recipe.count({
				where: {
					in_trash: false
				}
			})
		])
		const embeddingIndex = {
			total: embeddingTotal,
			remaining: embeddingRemaining,
			completed: Math.max(embeddingTotal - embeddingRemaining, 0)
		}
		return {
			...parentData,
			backupInfo,
			embeddingIndex,
			llmConfig,
			oauth
		}
	} catch (error) {
		console.error('Failed to load backup information:', error)
		return {
			...parentData,
			backupInfo: null,
			backupError: `Failed to load backup information: ${error.message}`,
			embeddingIndex: { total: 0, remaining: 0, completed: 0 },
			llmConfig,
			oauth
		}
	}
}
