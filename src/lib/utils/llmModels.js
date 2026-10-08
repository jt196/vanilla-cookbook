/**
 * LLM Provider and Model Configuration
 *
 * Curated for recipe parsing use cases:
 * - Text parsing: HTML extraction, ingredient cleanup, summarization
 * - Image parsing: Recipe photo analysis
 *
 * Prioritizes: speed, low cost, good instruction-following
 */

export const providerMeta = [
	{ value: 'openai', label: 'OpenAI', envVar: 'OPENAI_API_KEY', supportsEmbedding: true },
	{ value: 'anthropic', label: 'Anthropic', envVar: 'ANTHROPIC_API_KEY', supportsEmbedding: false },
	{ value: 'google', label: 'Google', envVar: 'GOOGLE_API_KEY', supportsEmbedding: true },
	{ value: 'ollama', label: 'Ollama (Local)', envVar: 'OLLAMA_BASE_URL', supportsEmbedding: true },
	{
		value: 'openai_compatible',
		label: 'OpenAI-compatible (LiteLLM, OpenRouter, LM Studio…)',
		envVar: 'OPENAI_COMPATIBLE_BASE_URL',
		supportsEmbedding: true
	}
]

/**
 * Connection settings for the generic OpenAI-compatible provider (LiteLLM, OpenRouter,
 * LM Studio, vLLM, …). The key is optional because local servers often don't need one;
 * the OpenAI SDK still requires a string, so a placeholder is used.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {{ baseURL: string, apiKey: string, hasApiKey: boolean } | null} null if no base URL is set
 */
export function getOpenAICompatibleConfig(env) {
	const baseURL = (env.OPENAI_COMPATIBLE_BASE_URL || '').trim().replace(/\/+$/, '')
	if (!baseURL) return null
	const key = (env.OPENAI_COMPATIBLE_API_KEY || '').trim()
	return { baseURL, apiKey: key || 'not-needed', hasApiKey: !!key }
}

// Derived lists for convenience
export const providerNames = providerMeta.map((p) => p.value)
export const embeddingProviderNames = providerMeta
	.filter((p) => p.supportsEmbedding)
	.map((p) => p.value)

// Backwards compatibility alias
export const embeddingProviderMeta = providerMeta.filter((p) => p.supportsEmbedding)

/**
 * Default embedding model per provider, used when the admin hasn't chosen one.
 * Kept fixed (rather than live) because changing it invalidates existing recipe embeddings.
 * The OpenAI-compatible provider has no default: the admin must name a model the server offers.
 */
export const defaultEmbeddingModels = {
	openai: 'text-embedding-3-small',
	google: 'gemini-embedding-001',
	ollama: 'nomic-embed-text'
}

export const providers = providerMeta.map((provider) => ({
	value: provider.value,
	label: provider.label
}))

/**
 * Where admins can look up current model IDs for each provider.
 * Model lists are fetched live from the provider (see `$lib/server/llmModelList`),
 * so there is no hardcoded chat/image catalog to keep up to date.
 */
export const providerModelDocs = {
	openai: 'https://platform.openai.com/docs/models',
	anthropic: 'https://docs.anthropic.com/en/docs/about-claude/models/overview',
	google: 'https://ai.google.dev/gemini-api/docs/models',
	ollama: 'https://ollama.com/library'
}

/**
 * Whether a provider supports a given AI purpose.
 *
 * @param {string} provider
 * @param {'chat' | 'image' | 'imageGeneration' | 'embedding'} purpose
 * @returns {boolean}
 */
export function providerSupports(provider, purpose) {
	if (!providerNames.includes(provider)) return false
	if (purpose === 'image') return provider !== 'ollama'
	if (purpose === 'imageGeneration') return provider !== 'anthropic'
	if (purpose === 'embedding') return embeddingProviderNames.includes(provider)
	return true
}

/**
 * Return providers configured in environment variables.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {string[]}
 */
export function getAvailableAiProviders(env) {
	return providerMeta.filter((provider) => env[provider.envVar]).map((provider) => provider.value)
}

/**
 * Resolve effective and selected providers from a preferred provider and available providers.
 *
 * @param {string | null | undefined} preferredProvider
 * @param {string[]} availableProviders
 * @returns {{ provider: string | null, selectedProvider: string | null, selectedProviderConfigured: boolean }}
 */
export function resolveProviderSelection(preferredProvider, availableProviders) {
	const selectedProvider = preferredProvider || null
	const provider = availableProviders.includes(selectedProvider)
		? selectedProvider
		: (availableProviders[0] ?? null)

	return {
		provider,
		selectedProvider,
		selectedProviderConfigured: !!selectedProvider && availableProviders.includes(selectedProvider)
	}
}

/**
 * Get all providers and annotate ones missing configuration.
 *
 * @param {string[]} availableProviders - List of provider IDs with API keys
 * @returns {Array<{value: string, label: string}>}
 */
export function getProviderOptionsWithAvailability(availableProviders) {
	const available = new Set(availableProviders || [])
	return providerMeta.map((provider) => ({
		value: provider.value,
		label: available.has(provider.value) ? provider.label : `${provider.label} (Missing API key)`
	}))
}

/**
 * Return embedding providers configured in environment variables.
 *
 * @param {Record<string, string | undefined>} env
 * @returns {string[]}
 */
export function getAvailableEmbeddingProviders(env) {
	return embeddingProviderMeta
		.filter((provider) => env[provider.envVar])
		.map((provider) => provider.value)
}

/**
 * Get embedding providers and annotate ones missing configuration.
 *
 * @param {string[]} availableProviders - List of embedding provider IDs with API keys/URLs
 * @returns {Array<{value: string, label: string}>}
 */
export function getEmbeddingProviderOptionsWithAvailability(availableProviders) {
	const available = new Set(availableProviders || [])
	return embeddingProviderMeta.map((provider) => ({
		value: provider.value,
		label: available.has(provider.value) ? provider.label : `${provider.label} (Missing API key)`
	}))
}

/**
 * Resolve embedding provider using configured provider availability.
 *
 * Precedence:
 * 1. Preferred provider (from runtime settings) if supported and configured
 * 2. First available configured provider
 *
 * @param {string | null | undefined} preferredProvider
 * @param {Record<string, string | undefined>} env
 * @returns {'openai' | 'google' | 'ollama' | 'openai_compatible' | null}
 */
export function resolveEmbeddingProvider(preferredProvider, env) {
	const availableProviders = getAvailableEmbeddingProviders(env)
	const preferred = (preferredProvider || '').trim().toLowerCase()

	if (preferred) {
		return availableProviders.includes(preferred) ? preferred : null
	}

	return availableProviders[0] ?? null
}

/**
 * Resolve embedding model for a provider.
 *
 * Model precedence:
 * 1. Explicit preferred model (admin/settings)
 * 2. Provider default from `defaultEmbeddingModels` (none for OpenAI-compatible)
 *
 * @param {'openai' | 'google' | 'ollama' | 'openai_compatible'} provider
 * @param {string | null | undefined} preferredModel
 * @returns {string | null} null for the OpenAI-compatible provider when no model is set
 */
export function resolveEmbeddingModel(provider, preferredModel) {
	if (preferredModel) return preferredModel
	if (provider === 'openai_compatible') return null
	return defaultEmbeddingModels[provider] || defaultEmbeddingModels.ollama
}
