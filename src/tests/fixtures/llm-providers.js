/**
 * LLM Provider Test Configuration
 *
 * Extends llmModels.js with API connection details for smoke tests.
 * All provider metadata, models, and capabilities come from llmModels.js.
 */
import {
	providerMeta,
	providerNames,
	embeddingProviderNames,
	imageModels,
	embeddingModels,
	getDefaultModelsForProvider
} from '$lib/utils/llmModels.js'

// Re-export from llmModels for convenience
export { providerMeta, providerNames, embeddingProviderNames }

// Derived capability lists
export const imageProviderNames = providerNames.filter((p) => (imageModels[p] || []).length > 0)

/**
 * API connection details for smoke tests.
 * Only contains URLs, request builders, and validators - everything else comes from llmModels.js
 */
export const apiConfigs = {
	openai: {
		chat: {
			url: 'https://api.openai.com/v1/chat/completions',
			buildRequest: (apiKey, model) => ({
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model,
					messages: [{ role: 'user', content: 'Return JSON: {"ok":true}' }],
					max_tokens: 20
				})
			}),
			validateResponse: (data) => data?.choices?.[0]?.message?.content
		},
		embedding: {
			url: 'https://api.openai.com/v1/embeddings',
			buildRequest: (apiKey, model) => ({
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({ model, input: 'test connection' })
			}),
			validateResponse: (data) =>
				Array.isArray(data?.data?.[0]?.embedding) && data.data[0].embedding.length > 0
		}
	},
	anthropic: {
		chat: {
			url: 'https://api.anthropic.com/v1/messages',
			buildRequest: (apiKey, model) => ({
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-api-key': apiKey,
					'anthropic-version': '2023-06-01'
				},
				body: JSON.stringify({
					model,
					max_tokens: 20,
					messages: [{ role: 'user', content: 'Return JSON: {"ok":true}' }]
				})
			}),
			validateResponse: (data) => data?.content?.[0]?.text
		}
	},
	google: {
		chat: {
			buildUrl: (apiKey, model) =>
				`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
			buildRequest: () => ({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [{ parts: [{ text: 'Return JSON: {"ok":true}' }] }],
					generationConfig: { maxOutputTokens: 20 }
				})
			}),
			validateResponse: (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text
		},
		embedding: {
			buildUrl: (apiKey, model) =>
				`https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`,
			buildRequest: () => ({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: { parts: [{ text: 'test connection' }] } })
			}),
			validateResponse: (data) =>
				Array.isArray(data?.embedding?.values) && data.embedding.values.length > 0
		}
	},
	ollama: {
		chat: {
			buildUrl: (baseUrl) => `${baseUrl}/api/chat`,
			buildRequest: (_, model) => ({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model,
					messages: [{ role: 'user', content: 'Return JSON: {"ok":true}' }],
					stream: false,
					options: { num_predict: 20 }
				})
			}),
			validateResponse: (data) => data?.message?.content
		},
		embedding: {
			buildUrl: (baseUrl) => `${baseUrl}/api/embeddings`,
			buildRequest: (_, model) => ({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ model, prompt: 'test connection' })
			}),
			validateResponse: (data) => Array.isArray(data?.embedding) && data.embedding.length > 0
		}
	}
}

/**
 * Get providers configured in the environment with their full config
 */
export function getConfiguredProviders(env = process.env) {
	return providerMeta
		.filter((p) => env[p.envVar])
		.map((p) => {
			const defaults = getDefaultModelsForProvider(p.value)
			const defaultEmbedding = embeddingModels[p.value]?.[0]?.value || null
			return {
				name: p.value,
				envValue: env[p.envVar],
				envVar: p.envVar,
				defaultTextModel: defaults.text,
				defaultImageModel: defaults.image,
				defaultEmbeddingModel: defaultEmbedding,
				supportsEmbedding: embeddingProviderNames.includes(p.value),
				supportsImage: imageProviderNames.includes(p.value),
				api: apiConfigs[p.value]
			}
		})
}

/**
 * Build mock env object for testing
 */
export function mockEnvWithProviders(...names) {
	const env = {}
	for (const name of names) {
		const meta = providerMeta.find((p) => p.value === name)
		if (meta) {
			env[meta.envVar] = name === 'ollama' ? 'http://localhost:11434' : `test-${name}-key`
		}
	}
	return env
}
