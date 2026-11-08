/**
 * Resolve the effective site, OAuth, AI and semantic-search configuration from the
 * SiteSettings row and environment variables. Used by hooks.server.js on every request;
 * results land on `event.locals.site`.
 *
 * @module siteConfig
 */
import {
	getAvailableAiProviders,
	getAvailableEmbeddingProviders,
	resolveEmbeddingProvider,
	resolveProviderSelection
} from '$lib/utils/llmModels'

const envTrue = (v) => typeof v === 'string' && /^(true|1|yes|on)$/i.test(v.trim())

// Log the "no AI model" warning once per process, not on every request
let warnedModelMissing = false

/**
 * Which OAuth/OIDC providers are configured.
 * @param {Record<string, string | undefined>} env
 */
export function resolveOAuth(env) {
	const githubEnabled = !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET)
	const googleEnabled = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
	const oidcEnabled = !!(env.OIDC_ISSUER_URL && env.OIDC_CLIENT_ID && env.OIDC_CLIENT_SECRET)
	return {
		githubEnabled,
		googleEnabled,
		oidcEnabled,
		oidcName: env.OIDC_NAME?.trim() || 'OIDC',
		oauthEnabled: githubEnabled || googleEnabled || oidcEnabled
	}
}

/**
 * Pick a provider for one AI role, falling back to any configured provider when the
 * preferred one has no API key, and warn when that happens.
 *
 * @param {string} role - e.g. 'AI image provider', used in the warning
 * @param {string | null} preferred - Provider chosen in settings/env
 * @param {string[]} available - Providers with API keys
 */
function pickProvider(role, preferred, available) {
	const { provider, selectedProvider, selectedProviderConfigured } = resolveProviderSelection(
		preferred,
		available
	)
	if (selectedProvider && !selectedProviderConfigured) {
		const fallback = provider
			? `Falling back to "${provider}".`
			: 'and no fallback provider is available.'
		console.warn(
			`${role} "${selectedProvider}" is selected but not configured in environment${provider ? '.' : ','} ${fallback}`
		)
	}
	// Configured models only apply while the preferred provider is the one in use
	const usingPreferred = !!provider && provider === preferred
	return { provider, selectedProvider, selectedProviderConfigured, usingPreferred }
}

/**
 * AI configuration. DB settings take precedence over env vars; AI is only enabled when
 * the site enables it and at least one provider has an API key.
 *
 * @param {object | null} s - SiteSettings row
 * @param {Record<string, string | undefined>} env
 */
export function resolveAi(s, env) {
	const availableProviders = getAvailableAiProviders(env)
	const hasAnyApiKey = availableProviders.length > 0
	const enabled = hasAnyApiKey && (s?.llmEnabled ?? envTrue(env.LLM_API_ENABLED))

	const preferred = s?.llmProvider || env.LLM_PROVIDER || null
	const text = pickProvider('AI provider', preferred, availableProviders)
	const image = pickProvider(
		'AI image provider',
		s?.llmImageProvider || preferred,
		availableProviders
	)
	const imageGeneration = pickProvider(
		'AI image generation provider',
		s?.llmImageGenerationProvider || preferred,
		availableProviders
	)

	// LLM_API_ENGINE_* are the older env names; invokeLLM still accepts them, so count them here too
	const textModel = text.usingPreferred
		? s?.llmTextModel || env.LLM_TEXT_MODEL || env.LLM_API_ENGINE_TEXT || null
		: null
	const imageModel = image.usingPreferred
		? s?.llmImageModel || env.LLM_IMAGE_MODEL || env.LLM_API_ENGINE_IMAGE || null
		: null
	const imageGenerationModel = imageGeneration.usingPreferred
		? s?.llmImageGenerationModel || env.LLM_IMAGE_GENERATION_MODEL || null
		: null

	// AI is on but has no text model to call: AI actions will fail until an admin picks one
	const modelMissing = !!enabled && !!text.provider && !textModel
	if (modelMissing && !warnedModelMissing) {
		warnedModelMissing = true
		console.warn(
			'AI is enabled but no text model is selected. AI features will fail until an admin chooses a model in Site Settings.'
		)
	}

	return {
		enabled,
		hasAnyApiKey,
		availableProviders,
		provider: text.provider,
		selectedProvider: text.selectedProvider,
		selectedProviderConfigured: text.selectedProviderConfigured,
		imageProvider: image.provider,
		textModel,
		imageModel,
		imageGenerationProvider: imageGeneration.provider,
		imageGenerationModel,
		imageAllowed: !!image.provider && image.provider !== 'ollama',
		modelMissing
	}
}

/**
 * Semantic search configuration: the site setting turns it on, but it only runs when an
 * embedding provider is available.
 *
 * @param {object | null} s - SiteSettings row
 * @param {Record<string, string | undefined>} env
 */
export function resolveSemantic(s, env) {
	const availableProviders = getAvailableEmbeddingProviders(env)
	const selectedProvider = s?.semanticEmbeddingProvider || null
	const provider = resolveEmbeddingProvider(selectedProvider, env)
	const enabledBySite = s?.semanticEnabled ?? false
	return {
		enabled: !!provider && enabledBySite,
		enabledBySite,
		providerAvailable: !!provider,
		provider,
		availableProviders,
		selectedProvider,
		selectedProviderConfigured: selectedProvider
			? availableProviders.includes(selectedProvider)
			: false,
		model: s?.semanticEmbeddingModel || null
	}
}

/**
 * Everything hooks.server.js puts on `locals.site`.
 *
 * @param {{ seeded: boolean, settingsRow: object | null, env: Record<string, string | undefined> }} args
 */
export function resolveSiteConfig({ seeded, settingsRow: s, env }) {
	const oauth = resolveOAuth(env)

	if (!seeded) {
		// Before setup: everything off, but report which providers the env would allow
		const availableProviders = getAvailableAiProviders(env)
		const embeddingProvider = resolveEmbeddingProvider(null, env)
		return {
			dbSeeded: false,
			oauth,
			settings: { registrationAllowed: false, requireLogin: false },
			ai: {
				enabled: false,
				hasAnyApiKey: availableProviders.length > 0,
				availableProviders,
				provider: null,
				selectedProvider: null,
				selectedProviderConfigured: false,
				imageProvider: null,
				textModel: null,
				imageModel: null,
				imageGenerationProvider: null,
				imageGenerationModel: null,
				imageAllowed: false
			},
			semantic: {
				enabled: false,
				enabledBySite: false,
				providerAvailable: !!embeddingProvider,
				provider: embeddingProvider,
				availableProviders: [],
				selectedProvider: null,
				selectedProviderConfigured: false,
				model: null
			}
		}
	}

	const registrationAllowed =
		env.REGISTRATION_ALLOWED !== undefined
			? envTrue(env.REGISTRATION_ALLOWED)
			: !!s?.registrationAllowed

	return {
		dbSeeded: true,
		oauth,
		settings: { ...s, registrationAllowed, requireLogin: s?.requireLogin ?? false },
		ai: resolveAi(s, env),
		semantic: resolveSemantic(s, env)
	}
}
