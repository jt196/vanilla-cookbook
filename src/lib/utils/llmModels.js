/**
 * LLM Provider and Model Configuration
 *
 * Curated for recipe parsing use cases:
 * - Text parsing: HTML extraction, ingredient cleanup, summarization
 * - Image parsing: Recipe photo analysis
 *
 * Prioritizes: speed, low cost, good instruction-following
 */

const providerMeta = [
	{ value: 'openai', label: 'OpenAI', envVar: 'OPENAI_API_KEY' },
	{ value: 'anthropic', label: 'Anthropic', envVar: 'ANTHROPIC_API_KEY' },
	{ value: 'google', label: 'Google', envVar: 'GOOGLE_API_KEY' },
	{ value: 'ollama', label: 'Ollama (Local)', envVar: 'OLLAMA_BASE_URL' }
]

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
