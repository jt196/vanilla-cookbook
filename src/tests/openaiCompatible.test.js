// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Read env live from process.env so vi.stubEnv applies (and the local .env can't leak in)
vi.mock('$env/dynamic/private', () => ({ env: process.env }))

import {
	getOpenAICompatibleConfig,
	describeOpenAICompatibleService,
	providerSupports,
	resolveEmbeddingModel,
	providerNames
} from '$lib/utils/llmModels.js'
import { listProviderModels, clearModelListCache } from '$lib/server/llmModelList.js'
import { testProviderConnection } from '$lib/utils/llmConnection.js'
import { getEmbedding } from '$lib/utils/embeddings.js'

const json = (body, status = 200) => Response.json(body, { status })

describe('getOpenAICompatibleConfig', () => {
	it('returns null when no base URL is set', () => {
		expect(getOpenAICompatibleConfig({})).toBeNull()
		expect(getOpenAICompatibleConfig({ OPENAI_COMPATIBLE_BASE_URL: '  ' })).toBeNull()
	})

	it('strips trailing slashes and uses a placeholder key when none is set', () => {
		expect(
			getOpenAICompatibleConfig({ OPENAI_COMPATIBLE_BASE_URL: 'http://litellm:4000/v1/' })
		).toEqual({
			baseURL: 'http://litellm:4000/v1',
			apiKey: 'not-needed',
			hasApiKey: false
		})
	})

	it('uses the key when provided', () => {
		const config = getOpenAICompatibleConfig({
			OPENAI_COMPATIBLE_BASE_URL: 'https://openrouter.ai/api/v1',
			OPENAI_COMPATIBLE_API_KEY: 'sk-or-123'
		})
		expect(config).toMatchObject({ apiKey: 'sk-or-123', hasApiKey: true })
	})
})

describe('describeOpenAICompatibleService', () => {
	it('names well-known services and links their model list', () => {
		expect(describeOpenAICompatibleService('https://openrouter.ai/api/v1')).toEqual({
			name: 'OpenRouter',
			docsUrl: 'https://openrouter.ai/models'
		})
		expect(describeOpenAICompatibleService('https://api.groq.com/openai/v1').name).toBe('Groq')
		expect(describeOpenAICompatibleService('https://api.x.ai/v1').name).toBe('xAI')
	})

	it('falls back to the host (with port) for anything else, without a link', () => {
		expect(describeOpenAICompatibleService('http://litellm:4000/v1')).toEqual({
			name: 'litellm:4000',
			docsUrl: ''
		})
		expect(describeOpenAICompatibleService('http://192.168.1.20:1234/v1').name).toBe(
			'192.168.1.20:1234'
		)
	})

	it('does not match look-alike hosts', () => {
		expect(describeOpenAICompatibleService('https://notopenrouter.ai/v1').name).toBe(
			'notopenrouter.ai'
		)
	})

	it('returns null without a base URL', () => {
		expect(describeOpenAICompatibleService('')).toBeNull()
	})
})

describe('openai_compatible provider capabilities', () => {
	it('is a known provider supporting every purpose', () => {
		expect(providerNames).toContain('openai_compatible')
		for (const purpose of ['chat', 'image', 'imageGeneration', 'embedding']) {
			expect(providerSupports('openai_compatible', purpose)).toBe(true)
		}
	})

	it('has no default embedding model', () => {
		expect(resolveEmbeddingModel('openai_compatible', null)).toBeNull()
		expect(resolveEmbeddingModel('openai_compatible', 'text-embedding-3-small')).toBe(
			'text-embedding-3-small'
		)
	})
})

describe('openai_compatible requests', () => {
	let fetchMock

	beforeEach(() => {
		clearModelListCache()
		vi.stubEnv('OPENAI_COMPATIBLE_BASE_URL', 'http://litellm:4000/v1/')
		vi.stubEnv('OPENAI_COMPATIBLE_API_KEY', '')
		vi.spyOn(console, 'error').mockImplementation(() => {})
		fetchMock = vi.fn()
		vi.stubGlobal('fetch', fetchMock)
	})

	afterEach(() => {
		vi.unstubAllEnvs()
		vi.unstubAllGlobals()
		vi.restoreAllMocks()
	})

	it('lists models from {base}/models without auth when no key is set, filtered and sorted', async () => {
		fetchMock.mockResolvedValue(
			json({
				data: [
					{ id: 'mistral/mistral-small', name: 'Mistral Small' },
					{ id: 'anthropic/claude-sonnet-5' },
					{ id: 'openai/text-embedding-3-small' },
					{ id: 'google/gemini-3.6-flash-preview' }
				]
			})
		)

		const chat = await listProviderModels('openai_compatible', 'chat')

		expect(fetchMock.mock.calls[0][0]).toBe('http://litellm:4000/v1/models')
		expect(fetchMock.mock.calls[0][1].headers).toEqual({})
		expect(chat.models.map((m) => m.value)).toEqual([
			'anthropic/claude-sonnet-5',
			'mistral/mistral-small',
			'google/gemini-3.6-flash-preview'
		])
		expect(chat.models[1].label).toBe('Mistral Small (mistral/mistral-small)')

		const embedding = await listProviderModels('openai_compatible', 'embedding')
		expect(embedding.models.map((m) => m.value)).toEqual(['openai/text-embedding-3-small'])
	})

	it('sends the key as a bearer token when set', async () => {
		vi.stubEnv('OPENAI_COMPATIBLE_API_KEY', 'sk-or-123')
		fetchMock.mockResolvedValue(json({ data: [] }))

		await listProviderModels('openai_compatible', 'chat')

		expect(fetchMock.mock.calls[0][1].headers).toEqual({ Authorization: 'Bearer sk-or-123' })
	})

	it('connection test posts to {base}/chat/completions', async () => {
		fetchMock.mockResolvedValue(json({ choices: [{ message: { content: '{"ok":true}' } }] }))

		const result = await testProviderConnection('openai_compatible', 'gpt-oss-20b', 'chat')

		expect(result.ok).toBe(true)
		expect(fetchMock.mock.calls[0][0]).toBe('http://litellm:4000/v1/chat/completions')
		expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe('gpt-oss-20b')
	})

	it('connection test reports a missing embedding model instead of guessing one', async () => {
		const result = await testProviderConnection('openai_compatible', undefined, 'embedding')

		expect(result.code).toBe('admin.site.msg.noModel')
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('embeds via {base}/embeddings', async () => {
		fetchMock.mockResolvedValue(json({ data: [{ embedding: [0.1, 0.2, 0.3] }] }))

		const vector = await getEmbedding('pancakes', 'openai_compatible', 'nomic-embed-text')

		expect(fetchMock.mock.calls[0][0]).toBe('http://litellm:4000/v1/embeddings')
		expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
			model: 'nomic-embed-text',
			input: 'pancakes'
		})
		expect(Array.from(vector)).toEqual([0.1, 0.2, 0.3].map(Math.fround))
	})

	it('refuses to embed without a model', async () => {
		await expect(getEmbedding('pancakes', 'openai_compatible', null)).rejects.toThrow(
			/No embedding model set/
		)
		expect(fetchMock).not.toHaveBeenCalled()
	})
})
