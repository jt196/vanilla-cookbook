import { env } from '$env/dynamic/private'
import { resolveEmbeddingProvider, resolveEmbeddingModel } from '$lib/utils/llmModels'

/**
 * Get embedding for text from configured provider.
 *
 * @param {string} text
 * @param {string | null} [preferredProvider=null]
 * @returns {Promise<Float32Array | null>}
 */
export async function getEmbedding(text, preferredProvider = null, preferredModel = null) {
	const trimmed = (text || '').trim()
	if (!trimmed) return null

	const provider = resolveEmbeddingProvider(preferredProvider, env)
	if (!provider) return null

	if (provider === 'openai') {
		return openaiEmbed(trimmed, preferredModel)
	}
	if (provider === 'google') {
		return googleEmbed(trimmed, preferredModel)
	}
	return ollamaEmbed(trimmed, preferredModel)
}

async function openaiEmbed(text, preferredModel = null) {
	const model = resolveEmbeddingModel('openai', preferredModel)
	const response = await fetch('https://api.openai.com/v1/embeddings', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.OPENAI_API_KEY}`
		},
		body: JSON.stringify({
			model,
			input: text
		})
	})

	if (!response.ok) {
		const body = await response.text()
		throw new Error(`OpenAI embedding failed: ${response.status} ${body}`)
	}

	const data = await response.json()
	const vector = data?.data?.[0]?.embedding
	if (!Array.isArray(vector)) return null
	return new Float32Array(vector)
}

async function ollamaEmbed(text, preferredModel = null) {
	const model = resolveEmbeddingModel('ollama', preferredModel)
	const baseUrl = env.OLLAMA_BASE_URL || 'http://localhost:11434'
	const response = await fetch(`${baseUrl}/api/embeddings`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			model,
			prompt: text
		})
	})

	if (!response.ok) {
		const body = await response.text()
		throw new Error(`Ollama embedding failed: ${response.status} ${body}`)
	}

	const data = await response.json()
	const vector = data?.embedding
	if (!Array.isArray(vector)) return null
	return new Float32Array(vector)
}

async function googleEmbed(text, preferredModel = null) {
	const configuredModel = resolveEmbeddingModel('google', preferredModel)
	const model = configuredModel.startsWith('models/')
		? configuredModel
		: `models/${configuredModel}`
	const response = await fetch(
		`https://generativelanguage.googleapis.com/v1beta/${model}:embedContent?key=${env.GOOGLE_API_KEY}`,
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				content: {
					parts: [{ text }]
				}
			})
		}
	)

	if (!response.ok) {
		const body = await response.text()
		throw new Error(`Google embedding failed: ${response.status} ${body}`)
	}

	const data = await response.json()
	const vector = data?.embedding?.values
	if (!Array.isArray(vector)) return null
	return new Float32Array(vector)
}

/**
 * Serialize embedding for Prisma Bytes storage.
 *
 * @param {Float32Array} embedding
 * @returns {Buffer}
 */
export function serializeEmbedding(embedding) {
	return Buffer.from(embedding.buffer.slice(0))
}

/**
 * Deserialize embedding from Prisma Bytes/Buffer.
 *
 * @param {Buffer | Uint8Array} bytes
 * @returns {Float32Array}
 */
export function deserializeEmbedding(bytes) {
	const buffer = bytes instanceof Buffer ? bytes : Buffer.from(bytes)
	return new Float32Array(buffer.buffer, buffer.byteOffset, Math.floor(buffer.byteLength / 4))
}

/**
 * Compute cosine similarity between vectors.
 *
 * @param {Float32Array} a
 * @param {Float32Array} b
 * @returns {number}
 */
export function cosineSimilarity(a, b) {
	if (!a || !b || a.length !== b.length || a.length === 0) return 0
	let dot = 0
	let normA = 0
	let normB = 0

	for (let i = 0; i < a.length; i++) {
		dot += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}

	if (normA === 0 || normB === 0) return 0
	return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Build a searchable text representation for a recipe.
 *
 * @param {Record<string, any>} recipe
 * @returns {string}
 */
export function prepareRecipeText(recipe) {
	const parts = [
		recipe?.name,
		recipe?.description,
		recipe?.ingredients,
		recipe?.directions,
		recipe?.notes,
		recipe?.source
	]
		.filter(Boolean)
		.map((v) => v.toString().trim())

	return parts.join('\n\n')
}
