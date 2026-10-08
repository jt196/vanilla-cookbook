import { env } from '$env/dynamic/private'
import { jsonError } from '$lib/server/authHelpers'
import { RECIPE_IMAGE_GENERATION_SIZE } from '$lib/utils/image/imageConfig'
import OpenAI from 'openai'
import { getOpenAICompatibleConfig } from '$lib/utils/llmModels'

/**
 * Resolve effective AI provider/model for an API request from hook-populated locals.
 *
 * @param {import('@sveltejs/kit').RequestEvent['locals']} locals
 * @param {'text' | 'image' | 'imageGeneration'} [type='text']
 * @returns {{ ok: true, provider: string, model: string | null } | { ok: false, response: Response }}
 */
export function resolveAIConfig(locals, type = 'text') {
	const ai = locals?.site?.ai

	if (!ai?.enabled) {
		return { ok: false, response: jsonError(503, 'AI features are disabled.') }
	}

	const provider =
		type === 'image'
			? ai.imageProvider || ai.provider
			: type === 'imageGeneration'
				? ai.imageGenerationProvider || ai.provider
				: ai.provider
	if (!provider) {
		return {
			ok: false,
			response: jsonError(500, `No AI ${type} provider configured.`)
		}
	}

	const availableProviders = ai.availableProviders || []
	if (!availableProviders.includes(provider)) {
		return {
			ok: false,
			response: jsonError(
				503,
				`Selected AI provider "${provider}" is not configured in the environment.`
			)
		}
	}

	if (type === 'image' && provider === 'ollama') {
		return {
			ok: false,
			response: jsonError(400, 'Selected AI provider does not support image parsing.')
		}
	}

	const model =
		type === 'image'
			? ai.imageModel || null
			: type === 'imageGeneration'
				? ai.imageGenerationModel || null
				: ai.textModel || null

	return { ok: true, provider, model }
}

/**
 * Resolve the image generation model, throwing a helpful error when none is set.
 *
 * @param {{ provider: string, model: string | null }} aiConfig
 * @returns {string}
 */
function requireImageGenerationModel(aiConfig) {
	const model = (aiConfig.model && aiConfig.model.trim()) || env.LLM_IMAGE_GENERATION_MODEL
	if (!model) {
		throw new Error(
			`No image generation model set for ${aiConfig.provider}. Enter a model name in Site Settings.`
		)
	}
	return model
}

/**
 * Generate an image buffer from a prompt using the configured AI provider.
 *
 * @param {{ provider: string, model: string | null }} aiConfig
 * @param {string} prompt
 * @returns {Promise<Buffer>}
 */
export async function generateImageBuffer(aiConfig, prompt) {
	if (aiConfig.provider === 'openai') {
		if (!env.OPENAI_API_KEY) {
			throw new Error('OPENAI_API_KEY is not configured.')
		}
		const client = new OpenAI({ apiKey: env.OPENAI_API_KEY })
		const generation = await client.images.generate({
			model: requireImageGenerationModel(aiConfig),
			prompt,
			size: RECIPE_IMAGE_GENERATION_SIZE
		})
		const b64 = generation?.data?.[0]?.b64_json
		if (!b64) throw new Error('OpenAI image generation returned no image.')
		return Buffer.from(b64, 'base64')
	}

	if (aiConfig.provider === 'openai_compatible') {
		const config = getOpenAICompatibleConfig(env)
		if (!config) throw new Error('OPENAI_COMPATIBLE_BASE_URL is not configured.')
		const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL })
		const generation = await client.images.generate({
			model: requireImageGenerationModel(aiConfig),
			prompt,
			size: RECIPE_IMAGE_GENERATION_SIZE
		})
		const result = generation?.data?.[0]
		if (result?.b64_json) return Buffer.from(result.b64_json, 'base64')
		// Some servers return a URL instead of base64
		if (result?.url) {
			const response = await fetch(result.url, { signal: AbortSignal.timeout(30000) })
			if (!response.ok) throw new Error(`Generated image download failed: HTTP ${response.status}`)
			return Buffer.from(await response.arrayBuffer())
		}
		throw new Error('Image generation returned no image.')
	}

	if (aiConfig.provider === 'google') {
		if (!env.GOOGLE_API_KEY) {
			throw new Error('GOOGLE_API_KEY is not configured.')
		}
		const model = env.GEMINI_IMAGE_GENERATION_MODEL
			? (aiConfig.model && aiConfig.model.trim()) || env.GEMINI_IMAGE_GENERATION_MODEL
			: requireImageGenerationModel(aiConfig)
		const response = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GOOGLE_API_KEY)}`,
			{
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					contents: [{ parts: [{ text: prompt }] }],
					generationConfig: { responseModalities: ['TEXT', 'IMAGE'] }
				})
			}
		)
		const payload = await response.json().catch(() => ({}))
		if (!response.ok) {
			throw new Error(payload?.error?.message || 'Gemini image generation request failed.')
		}
		const parts = payload?.candidates?.[0]?.content?.parts || []
		const inline = parts.find((part) => part?.inlineData?.data)
		if (!inline?.inlineData?.data) {
			throw new Error('Gemini image generation returned no image.')
		}
		return Buffer.from(inline.inlineData.data, 'base64')
	}

	if (aiConfig.provider === 'ollama') {
		// Ollama itself does not expose a native image generation API.
		// This supports local OpenAI-compatible endpoints if users route image generation there.
		const baseUrl = (env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '')
		const model = requireImageGenerationModel(aiConfig)
		const response = await fetch(`${baseUrl}/v1/images/generations`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ model, prompt, size: RECIPE_IMAGE_GENERATION_SIZE })
		})
		const payload = await response.json().catch(() => ({}))
		if (!response.ok) {
			throw new Error(
				payload?.error?.message ||
					payload?.error ||
					'Ollama local image generation endpoint is not available at /v1/images/generations.'
			)
		}
		const b64 = payload?.data?.[0]?.b64_json
		if (!b64) {
			throw new Error('Ollama local image generation returned no image.')
		}
		return Buffer.from(b64, 'base64')
	}

	if (aiConfig.provider === 'anthropic') {
		throw new Error(
			'Anthropic image generation is not currently supported. Select OpenAI, Google, or a local OpenAI-compatible image endpoint.'
		)
	}

	throw new Error(`Unsupported image generation provider: ${aiConfig.provider}`)
}
