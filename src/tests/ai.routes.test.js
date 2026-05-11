import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Route tests are intentionally mock-driven:
// they verify API wiring, validation, and response shapes without making real provider calls.
// This keeps tests fast, deterministic, and token-free.

// Mock the AI module (all LLM operations)
vi.mock('$lib/utils/ai', () => ({
	extractRecipeWithLLM: vi.fn(),
	generateRecipeWithLLM: vi.fn(),
	translateRecipeWithLLM: vi.fn()
}))

// Mock the aiHelpers module
vi.mock('$lib/server/aiHelpers', () => ({
	resolveAIConfig: vi.fn(),
	jsonError: vi.fn(
		(status, message) => new Response(JSON.stringify({ error: message }), { status })
	)
}))

// Mock the llmConnection module
vi.mock('$lib/utils/llmConnection', () => ({
	testProviderConnection: vi.fn(),
	getConfiguredProviders: vi.fn()
}))

// Mock authHelpers for admin checks in /api/llm/test
vi.mock('$lib/server/authHelpers', () => ({
	requireAdmin: vi.fn(),
	jsonError: vi.fn(
		(status, message) => new Response(JSON.stringify({ error: message }), { status })
	)
}))

import { extractRecipeWithLLM, generateRecipeWithLLM, translateRecipeWithLLM } from '$lib/utils/ai'
import { resolveAIConfig } from '$lib/server/aiHelpers'
import { testProviderConnection, getConfiguredProviders } from '$lib/utils/llmConnection'
import { requireAdmin } from '$lib/server/authHelpers'

// Import route handlers after mocks so handlers bind mocked dependencies.
import { POST as parsePost } from '../routes/api/recipe/parse/+server.js'
import { POST as translatePost } from '../routes/api/recipe/translate/+server.js'
import { POST as cleanupPost } from '../routes/api/recipe/cleanup/+server.js'
import { POST as llmTestPost, GET as llmTestGet } from '../routes/api/llm/test/+server.js'

// Test fixtures
const mockRecipe = {
	name: 'Test Recipe',
	author: 'Test Author',
	ingredients: ['1 cup flour', '2 eggs'],
	instructions: ['Mix ingredients', 'Bake at 350F']
}

const mockAIConfig = {
	ok: true,
	provider: 'openai',
	model: 'gpt-4o-mini'
}

const mockAIDisabled = {
	ok: false,
	response: new Response(JSON.stringify({ error: 'AI features are disabled.' }), { status: 503 })
}

const mockAdminLocals = {
	user: { userId: 'admin1', username: 'admin', isAdmin: true }
}

// Minimal request shim for JSON endpoints used by these handlers.
function createRequest(body, method = 'POST') {
	return {
		json: vi.fn().mockResolvedValue(body),
		method
	}
}

describe('API Routes - /api/recipe/parse', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		resolveAIConfig.mockReturnValue(mockAIConfig)
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('POST - text parsing mode', () => {
		it('returns parsed recipe on success', async () => {
			extractRecipeWithLLM.mockResolvedValue(mockRecipe)

			const request = createRequest({ text: 'Recipe content here', mode: 'parse' })
			const response = await parsePost({ request, locals: {} })
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data.name).toBe('Test Recipe')
			expect(data.ingredients).toHaveLength(2)
			expect(data._source).toBe('AI')
			expect(data._status).toBe('complete')
			expect(extractRecipeWithLLM).toHaveBeenCalledWith(
				expect.objectContaining({
					provider: 'openai',
					type: 'text',
					content: 'Recipe content here'
				})
			)
		})

		it('returns 400 when text is missing', async () => {
			const request = createRequest({ mode: 'parse' })
			const response = await parsePost({ request, locals: {} })
			const data = await response.json()

			expect(response.status).toBe(400)
			expect(data.error).toContain('Invalid or missing text')
		})

		it('returns 422 when recipe is incomplete', async () => {
			extractRecipeWithLLM.mockResolvedValue({ name: 'Test', ingredients: [] })

			const request = createRequest({ text: 'Some content' })
			const response = await parsePost({ request, locals: {} })
			const data = await response.json()

			expect(response.status).toBe(422)
			expect(data.error).toContain('incomplete')
		})

		it('returns 503 when AI is disabled', async () => {
			resolveAIConfig.mockReturnValue(mockAIDisabled)

			const request = createRequest({ text: 'Recipe content' })
			const response = await parsePost({ request, locals: {} })

			expect(response.status).toBe(503)
		})
	})

	describe('POST - prompt mode (generation)', () => {
		it('generates recipe from prompt', async () => {
			generateRecipeWithLLM.mockResolvedValue(mockRecipe)

			const request = createRequest({
				text: 'Make me a chocolate cake',
				mode: 'prompt',
				unitsPreference: 'metric'
			})
			const response = await parsePost({ request, locals: {} })
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data.name).toBe('Test Recipe')
			expect(generateRecipeWithLLM).toHaveBeenCalledWith(
				expect.objectContaining({
					prompt: 'Make me a chocolate cake',
					provider: 'openai',
					unitsPreference: 'metric'
				})
			)
		})
	})

	describe('error handling', () => {
		it('returns 500 on LLM error', async () => {
			extractRecipeWithLLM.mockRejectedValue(new Error('LLM API error'))
			vi.spyOn(console, 'error').mockImplementation(() => {})

			const request = createRequest({ text: 'Recipe content' })
			const response = await parsePost({ request, locals: {} })
			const data = await response.json()

			expect(response.status).toBe(500)
			expect(data.error).toContain('Failed to parse')
		})
	})
})

describe('API Routes - /api/recipe/translate', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		resolveAIConfig.mockReturnValue(mockAIConfig)
	})

	it('translates recipe to target language', async () => {
		const translatedRecipe = { ...mockRecipe, name: 'Recette de Test' }
		translateRecipeWithLLM.mockResolvedValue(translatedRecipe)

		const request = createRequest({
			recipe: mockRecipe,
			language: 'fra'
		})
		const response = await translatePost({ request, locals: {} })
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.recipe.name).toBe('Recette de Test')
		expect(translateRecipeWithLLM).toHaveBeenCalledWith(
			expect.objectContaining({
				recipe: mockRecipe,
				language: 'fra'
			})
		)
	})

	it('returns 400 when recipe is missing', async () => {
		const request = createRequest({ language: 'fra' })
		const response = await translatePost({ request, locals: {} })
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.error).toContain('Missing recipe')
	})

	it('returns 422 when translation response is invalid', async () => {
		translateRecipeWithLLM.mockResolvedValue(null)

		const request = createRequest({ recipe: mockRecipe, language: 'fra' })
		const response = await translatePost({ request, locals: {} })
		const data = await response.json()

		expect(response.status).toBe(422)
		expect(data.error).toContain('invalid response')
	})

	it('returns 503 when AI is disabled', async () => {
		resolveAIConfig.mockReturnValue(mockAIDisabled)

		const request = createRequest({ recipe: mockRecipe })
		const response = await translatePost({ request, locals: {} })

		expect(response.status).toBe(503)
	})
})

describe('API Routes - /api/recipe/cleanup', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		resolveAIConfig.mockReturnValue(mockAIConfig)
	})

	describe('ingredient cleanup', () => {
		it('cleans up ingredients list', async () => {
			generateRecipeWithLLM.mockResolvedValue({
				ingredients: ['100g flour', '2 eggs, beaten']
			})

			const request = createRequest({
				type: 'ingredients',
				content: '100 grams flour\n2 eggs (beaten)',
				userUnits: 'metric'
			})
			const response = await cleanupPost({ request, locals: {} })
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data.ingredients).toHaveLength(2)
			expect(data.ingredients).toContain('100g flour')
		})
	})

	describe('directions cleanup', () => {
		it('simplifies directions', async () => {
			generateRecipeWithLLM.mockResolvedValue({
				instructions: ['Mix dry ingredients', 'Add wet ingredients', 'Bake for 30 minutes']
			})

			const request = createRequest({
				type: 'directions',
				content: 'First, carefully mix all the dry ingredients together...'
			})
			const response = await cleanupPost({ request, locals: {} })
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data.instructions).toHaveLength(3)
		})
	})

	describe('nutrition cleanup', () => {
		it('normalizes nutrition into entries and text', async () => {
			generateRecipeWithLLM.mockResolvedValue({
				perServing: true,
				entries: [
					{ name: 'Calories', quantity: 471, unit: 'kcal' },
					{ name: 'Fat', quantity: 14.1, unit: 'g' }
				]
			})

			const request = createRequest({
				type: 'nutrition',
				content: 'Calories: 471 kcal | Fat: 14.1 g',
				language: 'eng'
			})
			const response = await cleanupPost({ request, locals: {} })
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data.nutrition).toBeDefined()
			expect(data.nutrition.perServing).toBe(true)
			expect(data.nutrition.entries).toHaveLength(2)
			expect(data.text.startsWith('per serving\n\n')).toBe(true)
			expect(data.text).toContain('Calories')
		})

		it('returns 422 for malformed nutrition response', async () => {
			generateRecipeWithLLM.mockResolvedValue({
				perServing: true
			})

			const request = createRequest({
				type: 'nutrition',
				content: 'Calories: 471 kcal'
			})
			const response = await cleanupPost({ request, locals: {} })
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data.source).toBe('fallback')
			expect(typeof data.text).toBe('string')
		})
	})

	it('falls back for nutrition cleanup when AI is disabled', async () => {
		resolveAIConfig.mockReturnValue(mockAIDisabled)

		const request = createRequest({
			type: 'nutrition',
			content: 'Calories: 123 kcal',
			language: 'eng'
		})
		const response = await cleanupPost({ request, locals: {} })
		const data = await response.json()

		expect(response.status).toBe(200)
		expect(data.source).toBe('fallback')
		expect(data.text).toContain('Calories')
	})

	describe('suggestions cleanup', () => {
		it('returns suggestions text', async () => {
			generateRecipeWithLLM.mockResolvedValue({
				text: '# Substitutions\n\nUse canned salmon instead of fresh.\n\n# Additions\n\nAdd capers for extra flavour.'
			})

			const request = createRequest({
				type: 'suggestions',
				content: "Chef John's Fresh Salmon Cakes: salmon, bread crumbs, egg..."
			})
			const response = await cleanupPost({ request, locals: {} })
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data.text).toContain('# Substitutions')
			expect(data.text).toContain('# Additions')
		})

		it('returns 422 when suggestions response is missing text field', async () => {
			generateRecipeWithLLM.mockResolvedValue({ name: 'Something else' })

			const request = createRequest({
				type: 'suggestions',
				content: 'Some recipe content'
			})
			const response = await cleanupPost({ request, locals: {} })
			const data = await response.json()

			expect(response.status).toBe(422)
			expect(data.error).toContain('invalid response')
		})
	})

	it('returns 400 when type is missing', async () => {
		const request = createRequest({ content: 'some content' })
		const response = await cleanupPost({ request, locals: {} })
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.error).toContain('Missing type')
	})

	it('returns 400 for invalid cleanup type', async () => {
		const request = createRequest({ type: 'invalid', content: 'content' })
		const response = await cleanupPost({ request, locals: {} })
		const data = await response.json()

		expect(response.status).toBe(400)
		expect(data.error).toContain('Invalid cleanup type')
	})

	it('returns 422 when cleanup response is missing expected field', async () => {
		generateRecipeWithLLM.mockResolvedValue({ name: 'Something else' })

		const request = createRequest({ type: 'ingredients', content: 'flour' })
		const response = await cleanupPost({ request, locals: {} })
		const data = await response.json()

		expect(response.status).toBe(422)
		expect(data.error).toContain('invalid response')
	})
})

describe('API Routes - /api/llm/test', () => {
	beforeEach(() => {
		vi.clearAllMocks()
		requireAdmin.mockReturnValue(mockAdminLocals.user)
	})

	describe('POST - connection test', () => {
		it('tests provider connection successfully', async () => {
			testProviderConnection.mockResolvedValue({
				ok: true,
				latencyMs: 150,
				model: 'gpt-4o-mini'
			})

			const request = createRequest({
				provider: 'openai',
				model: 'gpt-4o-mini',
				type: 'chat'
			})
			const response = await llmTestPost({ request, locals: mockAdminLocals })
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data.ok).toBe(true)
			expect(data.latencyMs).toBe(150)
			expect(testProviderConnection).toHaveBeenCalledWith('openai', 'gpt-4o-mini', 'chat')
		})

		it('returns connection failure details', async () => {
			testProviderConnection.mockResolvedValue({
				ok: false,
				latencyMs: 0,
				error: 'API key invalid'
			})

			const request = createRequest({ provider: 'openai' })
			const response = await llmTestPost({ request, locals: mockAdminLocals })
			const data = await response.json()

			expect(data.ok).toBe(false)
			expect(data.error).toBe('API key invalid')
		})

		it('returns 400 when provider is missing', async () => {
			const request = createRequest({})
			const response = await llmTestPost({ request, locals: mockAdminLocals })
			const data = await response.json()

			expect(response.status).toBe(400)
			expect(data.error).toContain('Provider is required')
		})

		it('returns 400 for invalid provider', async () => {
			const request = createRequest({ provider: 'invalid-provider' })
			const response = await llmTestPost({ request, locals: mockAdminLocals })
			const data = await response.json()

			expect(response.status).toBe(400)
			expect(data.error).toContain('Invalid provider')
		})

		it('returns 400 for invalid type', async () => {
			const request = createRequest({ provider: 'openai', type: 'invalid' })
			const response = await llmTestPost({ request, locals: mockAdminLocals })
			const data = await response.json()

			expect(response.status).toBe(400)
			expect(data.error).toContain('Invalid type')
		})
	})

	describe('GET - configured providers', () => {
		it('returns configured providers', async () => {
			getConfiguredProviders.mockReturnValue({
				chat: ['openai', 'anthropic'],
				embedding: ['openai']
			})

			const response = await llmTestGet({ locals: mockAdminLocals })
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data.chat).toContain('openai')
			expect(data.chat).toContain('anthropic')
			expect(data.embedding).toContain('openai')
		})
	})
})
