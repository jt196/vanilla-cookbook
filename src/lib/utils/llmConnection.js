import { env } from '$env/dynamic/private'
import {
	providerMeta,
	embeddingProviderNames,
	resolveEmbeddingModel,
	getOpenAICompatibleConfig
} from '$lib/utils/llmModels'
import { RECIPE_IMAGE_GENERATION_SIZE } from '$lib/utils/image/imageConfig'

/**
 * Turn a failed provider response into a readable message.
 * Pulls the provider's own error text out of its JSON body rather than echoing raw JSON.
 *
 * @param {number} status - HTTP status code
 * @param {string} body - Raw response body
 * @returns {string} e.g. "404: This model is no longer available to new users."
 */
export function describeProviderError(status, body) {
	let message = ''
	try {
		const data = JSON.parse(body)
		const err = Array.isArray(data) ? data[0]?.error : data?.error
		message = (typeof err === 'string' ? err : err?.message) || data?.message || ''
	} catch {
		message = body
	}
	message = String(message || '')
		.replace(/\s+/g, ' ')
		.trim()
	if (message.length > 300) message = `${message.substring(0, 300)}…`
	return message ? `${status}: ${message}` : `HTTP ${status}`
}

function noModelResult(provider) {
	return {
		ok: false,
		latencyMs: 0,
		error: `No model set for ${provider}. Enter a model name in Site Settings.`,
		code: 'admin.site.msg.noModel'
	}
}

async function failedResponseResult(provider, type, response, model, start) {
	const body = await response.text()
	const error = describeProviderError(response.status, body)
	console.error(`LLM connection test failed (${provider} ${type}, model ${model}): ${error}`)
	return {
		ok: false,
		latencyMs: Date.now() - start,
		error,
		code: 'admin.site.msg.connectionFailed',
		model
	}
}

// Room for the short test answer even when a reasoning model "thinks" first; 20 tokens
// left newer models with nothing to say (finish_reason: length, empty content).
const TEST_MAX_TOKENS = 200

/** Best-effort reason a provider stopped, across response shapes. */
function stopReason(data) {
	return (
		data?.choices?.[0]?.finish_reason ||
		data?.candidates?.[0]?.finishReason ||
		data?.stop_reason ||
		data?.done_reason ||
		null
	)
}

function openaiCompatibleHeaders() {
	const config = getOpenAICompatibleConfig(env)
	return {
		'Content-Type': 'application/json',
		...(config?.hasApiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
	}
}

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
					max_completion_tokens: TEST_MAX_TOKENS
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
		},
		imageGeneration: {
			url: 'https://api.openai.com/v1/images/generations',
			buildRequest: (apiKey, model) => ({
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				},
				body: JSON.stringify({
					model,
					prompt: 'A simple test image of a bowl of pasta on a table',
					size: RECIPE_IMAGE_GENERATION_SIZE
				})
			}),
			extractImage: (data) => data?.data?.[0]?.b64_json
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
					max_tokens: TEST_MAX_TOKENS,
					messages: [{ role: 'user', content: 'Return JSON: {"ok":true}' }]
				})
			}),
			extractContent: (data) => data?.content?.[0]?.text
		},
		imageGeneration: {
			unsupported: true
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
					generationConfig: { maxOutputTokens: TEST_MAX_TOKENS }
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
		},
		imageGeneration: {
			buildUrl: (apiKey, model) =>
				`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
			buildRequest: () => ({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [{ parts: [{ text: 'Generate a simple photo of pasta on a plate.' }] }],
					generationConfig: {
						responseModalities: ['TEXT', 'IMAGE']
					}
				})
			}),
			extractImage: (data) =>
				data?.candidates?.[0]?.content?.parts?.find((part) => part?.inlineData?.data)?.inlineData
					?.data
		}
	},
	// Generic OpenAI-compatible server (LiteLLM, OpenRouter, LM Studio, vLLM, …).
	// envValue is the base URL; the optional key comes from OPENAI_COMPATIBLE_API_KEY.
	openai_compatible: {
		chat: {
			buildUrl: (baseUrl) => `${baseUrl.replace(/\/+$/, '')}/chat/completions`,
			buildRequest: (_, model) => ({
				method: 'POST',
				headers: openaiCompatibleHeaders(),
				body: JSON.stringify({
					model,
					messages: [{ role: 'user', content: 'Return JSON: {"ok":true}' }],
					max_tokens: TEST_MAX_TOKENS
				})
			}),
			extractContent: (data) => data?.choices?.[0]?.message?.content
		},
		embedding: {
			buildUrl: (baseUrl) => `${baseUrl.replace(/\/+$/, '')}/embeddings`,
			buildRequest: (_, model) => ({
				method: 'POST',
				headers: openaiCompatibleHeaders(),
				body: JSON.stringify({ model, input: 'test connection' })
			}),
			extractEmbedding: (data) => data?.data?.[0]?.embedding
		},
		imageGeneration: {
			buildUrl: (baseUrl) => `${baseUrl.replace(/\/+$/, '')}/images/generations`,
			buildRequest: (_, model) => ({
				method: 'POST',
				headers: openaiCompatibleHeaders(),
				body: JSON.stringify({
					model,
					prompt: 'A simple test image of a bowl of pasta on a table',
					size: RECIPE_IMAGE_GENERATION_SIZE
				})
			}),
			extractImage: (data) => data?.data?.[0]?.b64_json || data?.data?.[0]?.url
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
					options: { num_predict: TEST_MAX_TOKENS }
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
		},
		imageGeneration: {
			buildUrl: (baseUrl) => `${baseUrl}/v1/images/generations`,
			buildRequest: (_, model) => ({
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model,
					prompt: 'A simple test image of a bowl of pasta on a table',
					size: RECIPE_IMAGE_GENERATION_SIZE
				})
			}),
			extractImage: (data) => data?.data?.[0]?.b64_json
		}
	}
}

/**
 * Test connection to an LLM provider.
 *
 * @param {string} provider - Provider name
 * @param {string} [model] - Model to use (required for chat and image generation; embeddings fall back to the provider default)
 * @param {'chat' | 'embedding' | 'imageGeneration'} [type='chat'] - Type of connection to test
 * @returns {Promise<{ ok: boolean, latencyMs: number, error?: string, code?: string, model?: string }>}
 */
export async function testProviderConnection(provider, model, type = 'chat') {
	const start = Date.now()
	const timeout = 15000

	try {
		// Get provider metadata
		const meta = providerMeta.find((p) => p.value === provider)
		if (!meta) {
			return {
				ok: false,
				latencyMs: 0,
				error: `Unknown provider: ${provider}`,
				code: 'admin.site.msg.connectionFailed'
			}
		}

		// Get API key/URL from env
		const envValue = env[meta.envVar]
		if (!envValue) {
			return {
				ok: false,
				latencyMs: 0,
				error: `${meta.envVar} not configured`,
				code: 'admin.site.msg.connectionFailed'
			}
		}

		// Get API config
		const config = apiConfigs[provider]
		if (!config) {
			return {
				ok: false,
				latencyMs: 0,
				error: `No API config for provider: ${provider}`,
				code: 'admin.site.msg.connectionFailed'
			}
		}

		if (type === 'embedding') {
			if (!embeddingProviderNames.includes(provider)) {
				return {
					ok: false,
					latencyMs: 0,
					error: `${provider} does not support embeddings`,
					code: 'admin.site.msg.connectionFailed'
				}
			}
			return await testEmbedding(provider, config.embedding, envValue, model, start, timeout)
		}

		if (type === 'imageGeneration') {
			return await testImageGeneration(
				provider,
				config.imageGeneration,
				envValue,
				model,
				start,
				timeout
			)
		}

		return await testChat(provider, config.chat, envValue, model, start, timeout)
	} catch (err) {
		const error =
			err instanceof Error && err.name === 'AbortError'
				? `Timed out after ${timeout / 1000}s`
				: err instanceof Error
					? err.message
					: String(err)
		console.error(
			`LLM connection test failed (${provider} ${type}, model ${model || 'default'}): ${error}`
		)
		return {
			ok: false,
			latencyMs: Date.now() - start,
			error,
			code: 'admin.site.msg.connectionFailed'
		}
	}
}

async function testImageGeneration(provider, apiConfig, envValue, model, start, timeout) {
	if (!apiConfig || apiConfig.unsupported) {
		return {
			ok: false,
			latencyMs: 0,
			error: `${provider} does not support image generation`,
			code: 'admin.site.msg.connectionFailed'
		}
	}

	const effectiveModel = model?.trim()
	if (!effectiveModel) return noModelResult(provider)

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
			return failedResponseResult(provider, 'imageGeneration', response, effectiveModel, start)
		}

		const data = await response.json()
		const imageData = apiConfig.extractImage(data)

		return {
			ok: !!imageData,
			latencyMs: Date.now() - start,
			model: effectiveModel
		}
	} finally {
		clearTimeout(timeoutId)
	}
}

async function testChat(provider, apiConfig, envValue, model, start, timeout) {
	const effectiveModel = model?.trim()
	if (!effectiveModel) return noModelResult(provider)

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
			return failedResponseResult(provider, 'chat', response, effectiveModel, start)
		}

		const data = await response.json()
		const content = apiConfig.extractContent(data)
		if (!content) {
			const reason = stopReason(data)
			const error = `Connected, but the model returned no text${reason ? ` (stopped: ${reason})` : ''}`
			console.error(
				`LLM connection test failed (${provider} chat, model ${effectiveModel}): ${error}`
			)
			return {
				ok: false,
				latencyMs: Date.now() - start,
				error,
				code: 'admin.site.msg.connectionFailed',
				model: effectiveModel
			}
		}

		return {
			ok: true,
			latencyMs: Date.now() - start,
			model: effectiveModel
		}
	} finally {
		clearTimeout(timeoutId)
	}
}

async function testEmbedding(provider, apiConfig, envValue, model, start, timeout) {
	const effectiveModel = resolveEmbeddingModel(provider, model)
	if (!effectiveModel) return noModelResult(provider)

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
			return failedResponseResult(provider, 'embedding', response, effectiveModel, start)
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
