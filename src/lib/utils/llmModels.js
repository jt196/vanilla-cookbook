/**
 * LLM Provider and Model Configuration
 *
 * Curated for recipe parsing use cases:
 * - Text parsing: HTML extraction, ingredient cleanup, summarization
 * - Image parsing: Recipe photo analysis
 *
 * Prioritizes: speed, low cost, good instruction-following
 */

export const providers = [
	{ value: 'openai', label: 'OpenAI' },
	{ value: 'anthropic', label: 'Anthropic' },
	{ value: 'google', label: 'Google' },
	{ value: 'ollama', label: 'Ollama (Local)' }
]

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
 * Get available providers filtered by which have API keys
 * @param {string[]} availableProviders - List of provider IDs with API keys
 * @returns {Array<{value: string, label: string}>}
 */
export function getAvailableProviders(availableProviders) {
	return providers.filter((p) => availableProviders.includes(p.value))
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
