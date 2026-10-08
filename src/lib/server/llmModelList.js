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

// Gemini image models also support generateContent, so they're split out by name, along with
// music, transcription, robotics and agent models that aren't useful for recipe text.
const GOOGLE_NOT_CHAT =
	/image|tts|audio|embedding|aqa|imagen|veo|live|lyria|transcribe|robotics|computer-use|deep-research|antigravity|nano-banana/

const LATEST_ALIAS = /-latest$/
const PRERELEASE = /preview|exp(erimental)?\b|-\d{2}-\d{2}$|beta|alpha/

/** @param {string} id */
function releaseRank(id) {
	if (PRERELEASE.test(id.replace(LATEST_ALIAS, ''))) return 2
	if (LATEST_ALIAS.test(id)) return 0
	return 1
}

/**
 * Compare version numbers found in two model IDs, highest first
 * (e.g. "gemini-3.6-flash" before "gemini-2.5-pro").
 *
 * @param {string} a
 * @param {string} b
 */
function compareVersionsDesc(a, b) {
	const va = (a.match(/\d+(?:\.\d+)*/)?.[0] || '0').split('.').map(Number)
	const vb = (b.match(/\d+(?:\.\d+)*/)?.[0] || '0').split('.').map(Number)
	for (let i = 0; i < Math.max(va.length, vb.length); i++) {
		const diff = (vb[i] || 0) - (va[i] || 0)
		if (diff) return diff
	}
	return 0
}

/**
 * Order models so the most useful choices come first: "-latest" aliases, then stable
 * models, then previews/experimental. Within those groups OpenAI and Anthropic keep their
 * newest-first API order; Google and Ollama (no dates) are grouped by model family with the
 * highest version first.
 *
 * @param {string} provider
 * @param {RawModel[]} models
 * @returns {RawModel[]}
 */
export function sortModels(provider, models) {
	const byVersion = provider === 'google' || provider === 'ollama'
	const family = (id) => id.split(/[-:.\d]/)[0]
	return [...models].sort((a, b) => {
		const rank = releaseRank(a.id) - releaseRank(b.id)
		if (rank || !byVersion) return rank
		return (
			family(a.id).localeCompare(family(b.id)) ||
			compareVersionsDesc(a.id, b.id) ||
			a.id.localeCompare(b.id)
		)
	})
}

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

	const filtered = filterModelsForPurpose(provider, purpose, raw.models)
	const models = sortModels(provider, filtered).map((m) => ({
		value: m.id,
		label: m.label && m.label !== m.id ? `${m.label} (${m.id})` : m.id
	}))
	return { ok: true, models }
}

/** Clear the in-memory model list cache (used by tests). */
export function clearModelListCache() {
	cache.clear()
}
