import { describe, it, expect } from 'vitest'
import {
	cosineSimilarity,
	serializeEmbedding,
	deserializeEmbedding,
	prepareRecipeText
} from '$lib/utils/embeddings.js'
import { resolveSemanticAvailability } from '$lib/server/semanticHelpers.js'

describe('semantic helpers', () => {
	it('cosineSimilarity returns 1 for identical vectors', () => {
		const a = new Float32Array([1, 2, 3])
		const b = new Float32Array([1, 2, 3])
		expect(cosineSimilarity(a, b)).toBeCloseTo(1, 6)
	})

	it('cosineSimilarity returns 0 for orthogonal vectors', () => {
		const a = new Float32Array([1, 0])
		const b = new Float32Array([0, 1])
		expect(cosineSimilarity(a, b)).toBeCloseTo(0, 6)
	})

	it('serialize/deserialize round-trips Float32Array', () => {
		const input = new Float32Array([0.1, 2.5, -3.25, 42])
		const bytes = serializeEmbedding(input)
		const output = deserializeEmbedding(bytes)
		expect(Array.from(output)).toEqual(Array.from(input))
	})

	it('prepareRecipeText combines core fields', () => {
		const text = prepareRecipeText({
			name: 'Miso Soup',
			description: 'Simple soup',
			ingredients: 'water\\nmiso paste',
			directions: 'boil water\\nstir miso',
			notes: 'serve warm',
			source: 'example.com'
		})
		expect(text).toContain('Miso Soup')
		expect(text).toContain('miso paste')
		expect(text).toContain('serve warm')
	})

	it('resolveSemanticAvailability blocks when globally disabled', () => {
		const result = resolveSemanticAvailability({
			site: { semantic: { enabled: false } }
		})
		expect(result.enabled).toBe(false)
		expect(result.response.status).toBe(503)
	})

	it('resolveSemanticAvailability allows when enabled', () => {
		const result = resolveSemanticAvailability({
			site: { semantic: { enabled: true } }
		})
		expect(result.enabled).toBe(true)
	})
})
