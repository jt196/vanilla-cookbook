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
	{ value: 'ollama', label: 'Ollama (Local)', envVar: 'OLLAMA_BASE_URL', supportsEmbedding: true }
]

// Derived lists for convenience
export const providerNames = providerMeta.map((p) => p.value)
export const embeddingProviderNames = providerMeta.filter((p) => p.supportsEmbedding).map((p) => p.value)

// Backwards compatibility alias
export const embeddingProviderMeta = providerMeta.filter((p) => p.supportsEmbedding)

export const embeddingModels = {
	openai: [
		{ value: 'text-embedding-3-small', label: 'text-embedding-3-small (Recommended)' },
		{ value: 'text-embedding-3-large', label: 'text-embedding-3-large' },
		{ value: 'text-embedding-ada-002', label: 'text-embedding-ada-002 (Legacy)' }
	],
	google: [
		{ value: 'gemini-embedding-001', label: 'gemini-embedding-001 (Recommended)' },
		{ value: 'text-embedding-004', label: 'text-embedding-004 (Legacy)' }
	],
	ollama: [
		{ value: 'nomic-embed-text', label: 'nomic-embed-text (Recommended)' },
		{ value: 'mxbai-embed-large', label: 'mxbai-embed-large' },
		{ value: 'all-minilm', label: 'all-minilm' }
	]
}

export const providers = providerMeta.map((provider) => ({
	value: provider.value,
	label: provider.label
}))

// Text models by provider - fast/cheap models for simple text processing
export const textModels = {
	openai: [
		{ value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommended)' },
		{ value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Cheapest)' },
		{ value: 'gpt-4o', label: 'GPT-4o (Higher quality)' }
	],
	anthropic: [
		{ value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku (Recommended)' },
		{ value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet' }
	],
	google: [
		{ value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Recommended)' },
		{ value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
		{ value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Higher quality)' }
	],
	ollama: [
		{ value: 'llama3.2', label: 'Llama 3.2' },
		{ value: 'llama3.1', label: 'Llama 3.1' },
		{ value: 'mistral', label: 'Mistral' },
		{ value: 'phi3', label: 'Phi-3 (Lightweight)' }
	]
}

// Image-capable models by provider (for recipe photo analysis)
// Ollama doesn't reliably support vision
export const imageModels = {
	openai: [
		{ value: 'gpt-4o-mini', label: 'GPT-4o Mini (Recommended)' },
		{ value: 'gpt-4o', label: 'GPT-4o (Higher quality)' }
	],
	anthropic: [
		{ value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Recommended)' },
		{ value: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' }
	],
	google: [
		{ value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Recommended)' },
		{ value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
		{ value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Higher quality)' }
	],
	ollama: [] // Ollama vision support is inconsistent
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
 * Get embedding models for a provider.
 *
 * @param {string} provider
 * @returns {Array<{value: string, label: string}>}
 */
export function getEmbeddingModelsForProvider(provider) {
	return embeddingModels[provider] || []
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
 * @returns {'openai' | 'google' | 'ollama' | null}
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
 * 2. Provider default model from curated list
 * 3. Hardcoded safety fallback
 *
 * @param {'openai' | 'google' | 'ollama'} provider
 * @param {string | null | undefined} preferredModel
 * @returns {string}
 */
export function resolveEmbeddingModel(provider, preferredModel) {
	if (preferredModel) return preferredModel
	return (
		getEmbeddingModelsForProvider(provider)?.[0]?.value ||
		(provider === 'openai'
			? 'text-embedding-3-small'
			: provider === 'google'
				? 'gemini-embedding-001'
				: 'nomic-embed-text')
	)
}

/**
 * Get text models for a provider, with Custom option appended
 * @param {string} provider
 * @returns {Array<{value: string, label: string}>}
 */
export function getTextModelsForProvider(provider) {
	const models = textModels[provider] || []
	return [...models, { value: 'custom', label: 'Custom...' }]
}

/**
 * Get image models for a provider, with Custom option appended
 * @param {string} provider
 * @returns {Array<{value: string, label: string}>}
 */
export function getImageModelsForProvider(provider) {
	const models = imageModels[provider] || []
	if (models.length === 0) return []
	return [...models, { value: 'custom', label: 'Custom...' }]
}

/**
 * Get default models for a provider (first model in each list is recommended).
 * Used by ai.js for LLM invocation defaults.
 *
 * @param {string} provider
 * @returns {{ text: string | null, image: string | null }}
 */
export function getDefaultModelsForProvider(provider) {
	const text = textModels[provider]?.[0]?.value || null
	const image = imageModels[provider]?.[0]?.value || null
	return { text, image }
}
