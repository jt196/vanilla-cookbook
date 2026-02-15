import { env } from '$env/dynamic/private'
import {
	providerMeta,
	embeddingProviderNames,
	embeddingModels,
	getDefaultModelsForProvider
} from '$lib/utils/llmModels'

/**
 * API connection configs for each provider.
 * Only contains the provider-specific parts - URLs, request builders, validators.
 */
const apiConfigs = {
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
			extractContent: (data) => data?.choices?.[0]?.message?.content
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
			extractEmbedding: (data) => data?.data?.[0]?.embedding
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
			extractContent: (data) => data?.content?.[0]?.text
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
			extractContent: (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text
		},
		embedding: {
			buildUrl: (apiKey, model) => {
				const modelPath = model.startsWith('models/') ? model : `models/${model}`
				return `https://generativelanguage.googleapis.com/v1beta/${modelPath}:embedContent?key=${apiKey}`
			},
			buildRequest: () => ({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: { parts: [{ text: 'test connection' }] } })
			}),
			extractEmbedding: (data) => data?.embedding?.values
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
			extractContent: (data) => data?.message?.content
		},
		embedding: {
			buildUrl: (baseUrl) => `${baseUrl}/api/embeddings`,
			buildRequest: (_, model) => ({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ model, prompt: 'test connection' })
			}),
			extractEmbedding: (data) => data?.embedding
		}
	}
}

/**
 * Test connection to an LLM provider.
 *
 * @param {string} provider - Provider name
 * @param {string} [model] - Model to use (defaults to provider's recommended model)
 * @param {'chat' | 'embedding'} [type='chat'] - Type of connection to test
 * @returns {Promise<{ ok: boolean, latencyMs: number, error?: string, model?: string }>}
 */
export async function testProviderConnection(provider, model, type = 'chat') {
	const start = Date.now()
	const timeout = 15000

	try {
		// Get provider metadata
		const meta = providerMeta.find((p) => p.value === provider)
		if (!meta) {
			return { ok: false, latencyMs: 0, error: `Unknown provider: ${provider}` }
		}

		// Get API key/URL from env
		const envValue = env[meta.envVar]
		if (!envValue) {
			return { ok: false, latencyMs: 0, error: `${meta.envVar} not configured` }
		}

		// Get API config
		const config = apiConfigs[provider]
		if (!config) {
			return { ok: false, latencyMs: 0, error: `No API config for provider: ${provider}` }
		}

		if (type === 'embedding') {
			if (!embeddingProviderNames.includes(provider)) {
				return { ok: false, latencyMs: 0, error: `${provider} does not support embeddings` }
			}
			return testEmbedding(provider, config.embedding, envValue, model, start, timeout)
		}

		return testChat(provider, config.chat, envValue, model, start, timeout)
	} catch (err) {
		return {
			ok: false,
			latencyMs: Date.now() - start,
			error: err instanceof Error ? err.message : String(err)
		}
	}
}

async function testChat(provider, apiConfig, envValue, model, start, timeout) {
	const effectiveModel = model || getDefaultModelsForProvider(provider).text

	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), timeout)

	try {
		const url = apiConfig.buildUrl ? apiConfig.buildUrl(envValue, effectiveModel) : apiConfig.url
		const request = {
			...apiConfig.buildRequest(envValue, effectiveModel),
			signal: controller.signal
		}

		const response = await fetch(url, request)
		clearTimeout(timeoutId)

		if (!response.ok) {
			const body = await response.text()
			return {
				ok: false,
				latencyMs: Date.now() - start,
				error: `API error: ${response.status} ${body.substring(0, 200)}`,
				model: effectiveModel
			}
		}

		const data = await response.json()
		const content = apiConfig.extractContent(data)

		return {
			ok: !!content,
			latencyMs: Date.now() - start,
			model: effectiveModel
		}
	} finally {
		clearTimeout(timeoutId)
	}
}

async function testEmbedding(provider, apiConfig, envValue, model, start, timeout) {
	const effectiveModel = model || embeddingModels[provider]?.[0]?.value

	if (!effectiveModel) {
		return { ok: false, latencyMs: 0, error: `No embedding model for ${provider}` }
	}

	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), timeout)

	try {
		const url = apiConfig.buildUrl ? apiConfig.buildUrl(envValue, effectiveModel) : apiConfig.url
		const request = {
			...apiConfig.buildRequest(envValue, effectiveModel),
			signal: controller.signal
		}

		const response = await fetch(url, request)
		clearTimeout(timeoutId)

		if (!response.ok) {
			const body = await response.text()
			return {
				ok: false,
				latencyMs: Date.now() - start,
				error: `API error: ${response.status} ${body.substring(0, 200)}`,
				model: effectiveModel
			}
		}

		const data = await response.json()
		const embedding = apiConfig.extractEmbedding(data)

		return {
			ok: Array.isArray(embedding) && embedding.length > 0,
			latencyMs: Date.now() - start,
			model: effectiveModel
		}
	} finally {
		clearTimeout(timeoutId)
	}
}

/**
 * Get available providers based on configured environment variables.
 * @returns {{ chat: string[], embedding: string[] }}
 */
export function getConfiguredProviders() {
	const chat = []
	const embedding = []

	for (const meta of providerMeta) {
		if (env[meta.envVar]) {
			chat.push(meta.value)
			if (embeddingProviderNames.includes(meta.value)) {
				embedding.push(meta.value)
			}
		}
	}

	return { chat, embedding }
}
