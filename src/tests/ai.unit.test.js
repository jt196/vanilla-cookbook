import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parseLLMJsonOutput } from '$lib/utils/ai.js'
import {
	getAvailableAiProviders,
	resolveProviderSelection,
	getDefaultModelsForProvider,
	getTextModelsForProvider,
	getImageModelsForProvider,
	getAvailableEmbeddingProviders,
	resolveEmbeddingProvider,
	resolveEmbeddingModel
} from '$lib/utils/llmModels.js'
import {
	providerMeta,
	providerNames,
	embeddingProviderNames,
	imageProviderNames,
	mockEnvWithProviders
} from './fixtures/llm-providers.js'

const fixturesDir = join(process.cwd(), 'src/tests/fixtures/llm-output')

function loadFixture(filename) {
	return readFileSync(join(fixturesDir, filename), 'utf-8')
}

describe('parseLLMJsonOutput', () => {
	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
		vi.spyOn(console, 'log').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('parses clean JSON correctly', () => {
		const input = loadFixture('clean.json')
		const result = parseLLMJsonOutput(input)

		expect(result.name).toBe('Test Recipe')
		expect(result.author).toBe('Test Author')
		expect(result.ingredients).toHaveLength(3)
		expect(result.instructions).toHaveLength(2)
	})

	it('handles markdown-fenced JSON', () => {
		const input = loadFixture('markdown-fenced.txt')
		const result = parseLLMJsonOutput(input)

		expect(result.name).toBe('Fenced Recipe')
		expect(result.author).toBe('Markdown Author')
		expect(result.ingredients).toContain('200g sugar')
	})

	it('handles trailing commas', () => {
		const input = loadFixture('trailing-comma.json')
		const result = parseLLMJsonOutput(input)

		expect(result.name).toBe('Trailing Comma Recipe')
		expect(result.ingredients).toHaveLength(2)
		expect(result.instructions).toHaveLength(2)
	})

	it('repairs truncated array', () => {
		const input = loadFixture('truncated-array.json')
		const result = parseLLMJsonOutput(input)

		expect(result.name).toBe('Truncated Array Recipe')
		expect(result.ingredients).toContain('100g flour')
	})

	it('repairs truncated object', () => {
		const input = loadFixture('truncated-object.json')
		const result = parseLLMJsonOutput(input)

		expect(result.name).toBe('Truncated Object Recipe')
		expect(result.ingredients).toHaveLength(2)
	})

	it('extracts JSON from extra content', () => {
		const input = loadFixture('extra-content.txt')
		const result = parseLLMJsonOutput(input)

		expect(result.name).toBe('Extra Content Recipe')
		expect(result.ingredients).toContain('1 onion')
	})

	it('handles empty input', () => {
		expect(() => parseLLMJsonOutput('')).toThrow()
		expect(() => parseLLMJsonOutput(null)).toThrow()
		expect(() => parseLLMJsonOutput(undefined)).toThrow()
	})

	it('handles whitespace-only input', () => {
		expect(() => parseLLMJsonOutput('   \n\t  ')).toThrow()
	})

	it('handles completely invalid input', () => {
		expect(() => parseLLMJsonOutput('This is not JSON at all')).toThrow()
	})

	it('preserves nutrition object', () => {
		const input = loadFixture('recipe-complete.json')
		const result = parseLLMJsonOutput(input)

		expect(result.nutrition).toBeDefined()
		expect(result.nutrition.calories).toBe('350')
		expect(result.nutrition.protein).toBe('35g')
	})

	it('handles partial recipe with empty fields', () => {
		const input = loadFixture('recipe-partial.json')
		const result = parseLLMJsonOutput(input)

		expect(result.name).toBe('Partial Recipe')
		expect(result.author).toBe('')
		expect(result.ingredients).toHaveLength(1)
		expect(result.instructions).toHaveLength(0)
	})

	it('handles recipe with non-standard field names', () => {
		const input = loadFixture('recipe-invalid.json')
		const result = parseLLMJsonOutput(input)

		expect(result.title).toBe('Wrong Field Name')
		expect(result.ingredients).toBeUndefined()
	})
})

describe('getAvailableAiProviders', () => {
	it('returns empty array when no keys configured', () => {
		const result = getAvailableAiProviders({})
		expect(result).toEqual([])
	})

	for (const meta of providerMeta) {
		it(`returns ${meta.value} when ${meta.envVar} is set`, () => {
			const env = mockEnvWithProviders(meta.value)
			const result = getAvailableAiProviders(env)
			expect(result).toContain(meta.value)
		})
	}

	it('returns multiple providers when multiple keys set', () => {
		const env = mockEnvWithProviders(...providerNames)
		const result = getAvailableAiProviders(env)
		for (const name of providerNames) {
			expect(result).toContain(name)
		}
		expect(result).toHaveLength(providerNames.length)
	})

	it('ignores empty string values', () => {
		const env = { [providerMeta[0].envVar]: '' }
		const result = getAvailableAiProviders(env)
		expect(result).not.toContain(providerMeta[0].value)
	})
})

describe('resolveProviderSelection', () => {
	it('returns null when no providers available', () => {
		const result = resolveProviderSelection(providerNames[0], [])
		expect(result.provider).toBeNull()
		expect(result.selectedProvider).toBe(providerNames[0])
		expect(result.selectedProviderConfigured).toBe(false)
	})

	it('returns preferred provider when available', () => {
		const [first, second] = providerNames
		const result = resolveProviderSelection(second, [first, second])
		expect(result.provider).toBe(second)
		expect(result.selectedProvider).toBe(second)
		expect(result.selectedProviderConfigured).toBe(true)
	})

	it('falls back to first available when preferred not available', () => {
		const [first, second, third] = providerNames
		const result = resolveProviderSelection(second, [first, third])
		expect(result.provider).toBe(first)
		expect(result.selectedProvider).toBe(second)
		expect(result.selectedProviderConfigured).toBe(false)
	})

	it('returns first available when no preference', () => {
		const [first, second] = providerNames
		const result = resolveProviderSelection(null, [second, first])
		expect(result.provider).toBe(second)
		expect(result.selectedProvider).toBeNull()
	})

	it('handles undefined preference', () => {
		const result = resolveProviderSelection(undefined, [providerNames[0]])
		expect(result.provider).toBe(providerNames[0])
	})
})

describe('getDefaultModelsForProvider', () => {
	for (const name of providerNames) {
		it(`returns non-null text model for ${name}`, () => {
			const result = getDefaultModelsForProvider(name)
			expect(result.text).toBeTruthy()
		})
	}

	it('returns nulls for unknown provider', () => {
		const result = getDefaultModelsForProvider('unknown')
		expect(result.text).toBeNull()
		expect(result.image).toBeNull()
	})
})

describe('getTextModelsForProvider', () => {
	for (const name of providerNames) {
		it(`returns models with Custom option for ${name}`, () => {
			const result = getTextModelsForProvider(name)
			expect(result.length).toBeGreaterThan(0)
			expect(result[result.length - 1].value).toBe('custom')
		})
	}

	it('returns only Custom option for unknown provider', () => {
		const result = getTextModelsForProvider('unknown')
		expect(result).toHaveLength(1)
		expect(result[0].value).toBe('custom')
	})
})

describe('getImageModelsForProvider', () => {
	for (const name of imageProviderNames) {
		it(`returns image models for ${name}`, () => {
			const result = getImageModelsForProvider(name)
			expect(result.length).toBeGreaterThan(0)
		})
	}

	for (const name of providerNames.filter((p) => !imageProviderNames.includes(p))) {
		it(`returns empty array for ${name} (no image support)`, () => {
			const result = getImageModelsForProvider(name)
			expect(result).toHaveLength(0)
		})
	}

	it('returns empty array for unknown provider', () => {
		const result = getImageModelsForProvider('unknown')
		expect(result).toHaveLength(0)
	})
})

describe('getAvailableEmbeddingProviders', () => {
	it('returns empty array when no keys configured', () => {
		const result = getAvailableEmbeddingProviders({})
		expect(result).toEqual([])
	})

	for (const name of embeddingProviderNames) {
		it(`returns ${name} for embedding when configured`, () => {
			const env = mockEnvWithProviders(name)
			const result = getAvailableEmbeddingProviders(env)
			expect(result).toContain(name)
		})
	}

	for (const name of providerNames.filter((p) => !embeddingProviderNames.includes(p))) {
		it(`does not include ${name} (no embedding support)`, () => {
			const env = mockEnvWithProviders(name)
			const result = getAvailableEmbeddingProviders(env)
			expect(result).not.toContain(name)
		})
	}
})

describe('resolveEmbeddingProvider', () => {
	it('returns null when no providers available', () => {
		const result = resolveEmbeddingProvider(embeddingProviderNames[0], {})
		expect(result).toBeNull()
	})

	it('returns preferred provider when available', () => {
		const name = embeddingProviderNames[0]
		const env = mockEnvWithProviders(name)
		const result = resolveEmbeddingProvider(name, env)
		expect(result).toBe(name)
	})

	it('returns first available when no preference', () => {
		const env = mockEnvWithProviders(...embeddingProviderNames)
		const result = resolveEmbeddingProvider(null, env)
		expect(embeddingProviderNames).toContain(result)
	})

	it('returns null when preferred provider not configured', () => {
		const [first, second] = embeddingProviderNames
		const env = mockEnvWithProviders(first)
		const result = resolveEmbeddingProvider(second, env)
		expect(result).toBeNull()
	})
})

describe('resolveEmbeddingModel', () => {
	it('returns preferred model when provided', () => {
		const result = resolveEmbeddingModel(embeddingProviderNames[0], 'custom-model')
		expect(result).toBe('custom-model')
	})

	for (const name of embeddingProviderNames) {
		it(`returns non-null default model for ${name}`, () => {
			const result = resolveEmbeddingModel(name, null)
			expect(result).toBeTruthy()
		})
	}
})
