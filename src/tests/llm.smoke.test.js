/**
 * LLM Provider Smoke Tests
 *
 * Verifies actual connectivity to LLM providers.
 * Auto-skips when API keys are not configured.
 *
 * Cost: ~20 tokens per test (tiny prompts)
 * Timeout: 15 seconds per test
 */
import { describe, it, expect } from 'vitest'
import { getConfiguredProviders } from './fixtures/llm-providers.js'

const TIMEOUT = 15000
const runLiveSmoke = process.env.RUN_LLM_SMOKE === 'true'
const configuredProviders = runLiveSmoke ? getConfiguredProviders() : []

describe('LLM Provider Connectivity', () => {
	if (!runLiveSmoke) {
		it('skips live smoke tests unless RUN_LLM_SMOKE=true', () => {
			console.log('Set RUN_LLM_SMOKE=true to run live provider connectivity tests')
			expect(true).toBe(true)
		})
		return
	}

	if (configuredProviders.length === 0) {
		it('skips all tests - no providers configured', () => {
			console.log('No LLM providers configured in environment')
			expect(true).toBe(true)
		})
		return
	}

	for (const provider of configuredProviders) {
		describe(provider.name, () => {
			if (provider.api?.chat) {
				it(
					`connects to ${provider.name} chat API`,
					async () => {
						const api = provider.api.chat
						const model = provider.defaultTextModel
						const url = api.buildUrl ? api.buildUrl(provider.envValue, model) : api.url
						const request = api.buildRequest(provider.envValue, model)

						const response = await fetch(url, request)
						expect(response.ok).toBe(true)

						const data = await response.json()
						expect(api.validateResponse(data)).toBeTruthy()
					},
					TIMEOUT
				)
			}

			if (provider.supportsEmbedding && provider.api?.embedding) {
				it(
					`connects to ${provider.name} embedding API`,
					async () => {
						const api = provider.api.embedding
						const model = provider.defaultEmbeddingModel
						const url = api.buildUrl ? api.buildUrl(provider.envValue, model) : api.url
						const request = api.buildRequest(provider.envValue, model)

						const response = await fetch(url, request)
						expect(response.ok).toBe(true)

						const data = await response.json()
						expect(api.validateResponse(data)).toBeTruthy()
					},
					TIMEOUT
				)
			}
		})
	}
})

describe('Provider availability', () => {
	it('reports configured providers', () => {
		const names = configuredProviders.map((p) => p.name)
		console.log(`Configured providers: ${names.length > 0 ? names.join(', ') : 'none'}`)
		expect(true).toBe(true)
	})
})
