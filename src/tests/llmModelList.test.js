import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
	filterModelsForPurpose,
	listProviderModels,
	clearModelListCache
} from '$lib/server/llmModelList.js'
import { describeProviderError, testProviderConnection } from '$lib/utils/llmConnection.js'

// Read env live from process.env so vi.stubEnv applies (and the local .env can't leak in)
vi.mock('$env/dynamic/private', () => ({ env: process.env }))

const ids = (models) => models.map((m) => m.id)

describe('filterModelsForPurpose', () => {
	const openaiModels = [
		{ id: 'gpt-5.6-luna' },
		{ id: 'gpt-image-1' },
		{ id: 'dall-e-3' },
		{ id: 'text-embedding-3-small' },
		{ id: 'whisper-1' },
		{ id: 'tts-1' },
		{ id: 'omni-moderation-latest' }
	]

	it('keeps only chat models for openai chat', () => {
		expect(ids(filterModelsForPurpose('openai', 'chat', openaiModels))).toEqual(['gpt-5.6-luna'])
	})

	it('keeps image generation models for openai', () => {
		expect(ids(filterModelsForPurpose('openai', 'imageGeneration', openaiModels))).toEqual([
			'gpt-image-1',
			'dall-e-3'
		])
	})

	it('keeps embedding models for openai', () => {
		expect(ids(filterModelsForPurpose('openai', 'embedding', openaiModels))).toEqual([
			'text-embedding-3-small'
		])
	})

	const googleModels = [
		{ id: 'gemini-3.6-flash', methods: ['generateContent', 'countTokens'] },
		{ id: 'gemini-3.6-flash-image', methods: ['generateContent'] },
		{ id: 'gemini-embedding-001', methods: ['embedContent'] },
		{ id: 'gemini-3.6-flash-preview-tts', methods: ['generateContent'] }
	]

	it('uses supportedGenerationMethods and names for google', () => {
		expect(ids(filterModelsForPurpose('google', 'chat', googleModels))).toEqual([
			'gemini-3.6-flash'
		])
		expect(ids(filterModelsForPurpose('google', 'imageGeneration', googleModels))).toEqual([
			'gemini-3.6-flash-image'
		])
		expect(ids(filterModelsForPurpose('google', 'embedding', googleModels))).toEqual([
			'gemini-embedding-001'
		])
	})

	it('returns no anthropic models for embeddings or image generation', () => {
		const models = [{ id: 'claude-sonnet-5' }]
		expect(filterModelsForPurpose('anthropic', 'chat', models)).toEqual(models)
		expect(filterModelsForPurpose('anthropic', 'embedding', models)).toEqual([])
		expect(filterModelsForPurpose('anthropic', 'imageGeneration', models)).toEqual([])
	})

	it('returns all locally pulled ollama models', () => {
		const models = [{ id: 'llama3.2' }, { id: 'nomic-embed-text' }]
		expect(filterModelsForPurpose('ollama', 'embedding', models)).toEqual(models)
	})
})

describe('listProviderModels', () => {
	beforeEach(() => {
		clearModelListCache()
		vi.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.unstubAllEnvs()
		vi.unstubAllGlobals()
		vi.restoreAllMocks()
	})

	it('fetches google models and strips the models/ prefix', async () => {
		vi.stubEnv('GOOGLE_API_KEY', 'test-key')
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({
				models: [
					{
						name: 'models/gemini-3.6-flash',
						displayName: 'Gemini 3.6 Flash',
						supportedGenerationMethods: ['generateContent']
					}
				]
			})
		})
		vi.stubGlobal('fetch', fetchMock)

		const result = await listProviderModels('google', 'chat')
		expect(result).toEqual({
			ok: true,
			models: [{ value: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash (gemini-3.6-flash)' }]
		})

		// Second call is served from cache
		await listProviderModels('google', 'chat')
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})

	it('returns the provider error message when listing fails', async () => {
		vi.stubEnv('OPENAI_API_KEY', 'bad-key')
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 401,
				text: async () => JSON.stringify({ error: { message: 'Incorrect API key provided' } })
			})
		)

		const result = await listProviderModels('openai', 'chat')
		expect(result).toEqual({ ok: false, error: '401: Incorrect API key provided' })
	})

	it('reports a missing API key without calling the provider', async () => {
		vi.stubEnv('ANTHROPIC_API_KEY', '')
		const fetchMock = vi.fn()
		vi.stubGlobal('fetch', fetchMock)

		const result = await listProviderModels('anthropic', 'chat')
		expect(result.ok).toBe(false)
		expect(fetchMock).not.toHaveBeenCalled()
	})
})

describe('describeProviderError', () => {
	it('extracts the message from a google-style error body', () => {
		const body = JSON.stringify({
			error: { code: 404, message: 'This model is no longer available to new users.' }
		})
		expect(describeProviderError(404, body)).toBe(
			'404: This model is no longer available to new users.'
		)
	})

	it('handles string errors (ollama)', () => {
		expect(describeProviderError(404, JSON.stringify({ error: 'model "foo" not found' }))).toBe(
			'404: model "foo" not found'
		)
	})

	it('falls back to the raw body when it is not JSON', () => {
		expect(describeProviderError(502, 'Bad Gateway')).toBe('502: Bad Gateway')
	})

	it('handles an empty body', () => {
		expect(describeProviderError(500, '')).toBe('HTTP 500')
	})
})

describe('testProviderConnection', () => {
	beforeEach(() => {
		vi.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.unstubAllEnvs()
		vi.unstubAllGlobals()
		vi.restoreAllMocks()
	})

	it('reports a missing chat model instead of guessing one', async () => {
		vi.stubEnv('GOOGLE_API_KEY', 'test-key')
		const fetchMock = vi.fn()
		vi.stubGlobal('fetch', fetchMock)

		const result = await testProviderConnection('google', undefined, 'chat')
		expect(result.ok).toBe(false)
		expect(result.code).toBe('admin.site.msg.noModel')
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('returns and logs the provider error message', async () => {
		vi.stubEnv('GOOGLE_API_KEY', 'test-key')
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: false,
				status: 429,
				text: async () => JSON.stringify({ error: { message: 'Quota exceeded.' } })
			})
		)

		const result = await testProviderConnection('google', 'gemini-3.6-flash', 'chat')
		expect(result.ok).toBe(false)
		expect(result.error).toBe('429: Quota exceeded.')
		expect(console.error).toHaveBeenCalledWith(expect.stringContaining('429: Quota exceeded.'))
	})

	it('catches network failures from the provider', async () => {
		vi.stubEnv('GOOGLE_API_KEY', 'test-key')
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND')))

		const result = await testProviderConnection('google', 'gemini-3.6-flash', 'chat')
		expect(result.ok).toBe(false)
		expect(result.error).toBe('getaddrinfo ENOTFOUND')
	})
})
