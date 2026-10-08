import { env } from '$env/dynamic/private'
import { providerMeta, providerSupports } from '$lib/utils/llmModels'
import { describeProviderError } from '$lib/utils/llmConnection'

const CACHE_TTL_MS = 10 * 60 * 1000
const FETCH_TIMEOUT_MS = 10000

/** @type {Map<string, { expires: number, models: RawModel[] }>} */
const cache = new Map()

/**
 * @typedef {Object} RawModel
 * @property {string} id - Model ID as passed to the provider API
 * @property {string} [label] - Human-readable name, if the provider gives one
 * @property {string[]} [methods] - Google only: supportedGenerationMethods
 */

// OpenAI's /v1/models returns every model on the account, including audio,
// moderation and legacy completion models. These patterns sort them by purpose.
const OPENAI_EMBEDDING = /embedding/
const OPENAI_IMAGE_GENERATION = /^(gpt-image|dall-e|chatgpt-image)/
const OPENAI_NOT_CHAT =
	/embedding|whisper|tts|dall-e|image|moderation|audio|realtime|transcribe|davinci|babbage|sora|search/

// Gemini image models also support generateContent, so they're split out by name.
const GOOGLE_NOT_CHAT = /image|tts|audio|embedding|aqa|imagen|veo|live/

/**
 * Fetch the raw model list for a provider.
 *
 * @param {string} provider
 * @param {string} envValue - API key, or base URL for Ollama
 * @param {AbortSignal} signal
 * @returns {Promise<RawModel[]>}
 */
async function fetchRawModels(provider, envValue, signal) {
	if (provider === 'openai') {
		const data = await getJson('https://api.openai.com/v1/models', {
			headers: { Authorization: `Bearer ${envValue}` },
			signal
		})
		return (data?.data || [])
			.sort((a, b) => (b.created || 0) - (a.created || 0))
			.map((m) => ({ id: m.id }))
	}

	if (provider === 'anthropic') {
		const data = await getJson('https://api.anthropic.com/v1/models?limit=100', {
			headers: { 'x-api-key': envValue, 'anthropic-version': '2023-06-01' },
			signal
		})
		return (data?.data || []).map((m) => ({ id: m.id, label: m.display_name }))
	}

	if (provider === 'google') {
		const data = await getJson(
			`https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${encodeURIComponent(envValue)}`,
			{ signal }
		)
		return (data?.models || []).map((m) => ({
			id: String(m.name || '').replace(/^models\//, ''),
			label: m.displayName,
			methods: m.supportedGenerationMethods || []
		}))
	}

	if (provider === 'ollama') {
		const baseUrl = envValue.replace(/\/$/, '')
		const data = await getJson(`${baseUrl}/api/tags`, { signal })
		return (data?.models || []).map((m) => ({ id: m.name }))
	}

	throw new Error(`Unknown provider: ${provider}`)
}

async function getJson(url, init) {
	const response = await fetch(url, init)
	if (!response.ok) {
		const body = await response.text().catch(() => '')
		throw new Error(describeProviderError(response.status, body))
	}
	return response.json()
}

/**
 * Narrow a provider's full model list to the ones useful for a purpose.
 * Ollama lists only what the admin has pulled locally, so it is returned as-is.
 *
 * @param {string} provider
 * @param {'chat' | 'image' | 'imageGeneration' | 'embedding'} purpose
 * @param {RawModel[]} models
 * @returns {RawModel[]}
 */
export function filterModelsForPurpose(provider, purpose, models) {
	if (provider === 'openai') {
		if (purpose === 'embedding') return models.filter((m) => OPENAI_EMBEDDING.test(m.id))
		if (purpose === 'imageGeneration')
			return models.filter((m) => OPENAI_IMAGE_GENERATION.test(m.id))
		return models.filter((m) => !OPENAI_NOT_CHAT.test(m.id))
	}

	if (provider === 'google') {
		const supports = (m, method) => (m.methods || []).includes(method)
		if (purpose === 'embedding') return models.filter((m) => supports(m, 'embedContent'))
		if (purpose === 'imageGeneration')
			return models.filter((m) => supports(m, 'generateContent') && /image/.test(m.id))
		return models.filter((m) => supports(m, 'generateContent') && !GOOGLE_NOT_CHAT.test(m.id))
	}

	if (provider === 'anthropic') {
		return purpose === 'chat' || purpose === 'image' ? models : []
	}

	return models
}

/**
 * List the models a provider currently offers for a purpose, live from the provider's API.
 * Results are cached in memory for a few minutes per provider.
 *
 * @param {string} provider
 * @param {'chat' | 'image' | 'imageGeneration' | 'embedding'} [purpose='chat']
 * @returns {Promise<{ ok: true, models: Array<{ value: string, label: string }> } | { ok: false, error: string }>}
 */
export async function listProviderModels(provider, purpose = 'chat') {
	const meta = providerMeta.find((p) => p.value === provider)
	if (!meta) return { ok: false, error: `Unknown provider: ${provider}` }
	if (!providerSupports(provider, purpose)) return { ok: true, models: [] }

	const envValue = env[meta.envVar]
	if (!envValue) return { ok: false, error: `${meta.envVar} not configured` }

	let raw = cache.get(provider)
	if (!raw || raw.expires < Date.now()) {
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
		try {
			const models = await fetchRawModels(provider, envValue, controller.signal)
			raw = { expires: Date.now() + CACHE_TTL_MS, models }
			cache.set(provider, raw)
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err)
			console.error(`Failed to list ${provider} models:`, message)
			return { ok: false, error: message }
		} finally {
			clearTimeout(timeoutId)
		}
	}

	const models = filterModelsForPurpose(provider, purpose, raw.models).map((m) => ({
		value: m.id,
		label: m.label && m.label !== m.id ? `${m.label} (${m.id})` : m.id
	}))
	return { ok: true, models }
}

/** Clear the in-memory model list cache (used by tests). */
export function clearModelListCache() {
	cache.clear()
}
