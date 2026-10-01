import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('$env/dynamic/private', () => ({ env: { GOOGLE_API_KEY: 'test-google-key' } }))

import { testProviderConnection } from '$lib/utils/llmConnection'
import * as llmModels from '$lib/utils/llmModels'

// Gemini ids that Google's models and deprecations pages list as shut down, or as no longer
// available to new API users (https://ai.google.dev/gemini-api/docs/deprecations).
// The mock answers these with the 404 body new users get, so a default that still names one fails.
const RETIRED_FOR_NEW_USERS = [
	'gemini-2.5-flash',
	'gemini-2.5-flash-lite',
	'gemini-2.5-pro',
	'gemini-2.5-flash-image',
	'gemini-3-pro-image-preview',
	'gemini-3.1-flash-image-preview'
]

const RETIRED_BODY = {
	error: {
		code: 404,
		message: 'This model is no longer available to new users. Please use a newer model.',
		status: 'NOT_FOUND'
	}
}

function modelFromUrl(url) {
	const match = String(url).match(/\/models\/([^:]+):generateContent/)
	return match ? decodeURIComponent(match[1]) : null
}

function mockGeminiEndpoint() {
	return vi.fn(async (url) => {
		const model = modelFromUrl(url)
		if (RETIRED_FOR_NEW_USERS.includes(model)) {
			return new Response(JSON.stringify(RETIRED_BODY), {
				status: 404,
				headers: { 'Content-Type': 'application/json' }
			})
		}
		const body = {
			candidates: [
				{
					content: {
						parts: [
							{ text: '{"ok":true}' },
							{ inlineData: { mimeType: 'image/png', data: 'iVBORw0KGgo=' } }
						]
					}
				}
			]
		}
		return new Response(JSON.stringify(body), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		})
	})
}

describe('Gemini defaults (issue #421)', () => {
	let fetchMock

	beforeEach(() => {
		fetchMock = mockGeminiEndpoint()
		vi.stubGlobal('fetch', fetchMock)
	})

	afterEach(() => {
		vi.unstubAllGlobals()
	})

	it('connection test with the default Google text model succeeds', async () => {
		const result = await testProviderConnection('google')
		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(result.error).toBeUndefined()
		expect(result.ok).toBe(true)
	})

	it('connection test with the default Google image generation model succeeds', async () => {
		const result = await testProviderConnection('google', undefined, 'imageGeneration')
		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(result.error).toBeUndefined()
		expect(result.ok).toBe(true)
	})

	it('every listed Google text, image and image generation model is still available', () => {
		const listed = [
			...llmModels.textModels.google,
			...llmModels.imageModels.google,
			...llmModels.imageGenerationModels.google
		].map((m) => m.value)
		expect(listed.filter((id) => RETIRED_FOR_NEW_USERS.includes(id))).toEqual([])
	})

	it('a stored default that Google retired resolves to the current default', () => {
		const { resolveRetiredModel } = llmModels
		expect(typeof resolveRetiredModel).toBe('function')
		const current = llmModels.getDefaultModelsForProvider('google')
		expect(resolveRetiredModel('google', 'gemini-2.5-flash')).toBe(current.text)
		expect(resolveRetiredModel('google', 'gemini-2.5-flash-image')).toBe(
			llmModels.imageGenerationModels.google[0].value
		)
		expect(resolveRetiredModel('google', 'gemini-3-pro-image-preview')).toBe('gemini-3-pro-image')
		// A model the admin picked on purpose is left alone, as are other providers and empty values.
		expect(resolveRetiredModel('google', 'gemini-2.5-pro')).toBe('gemini-2.5-pro')
		expect(resolveRetiredModel('openai', 'gemini-2.5-flash')).toBe('gemini-2.5-flash')
		expect(resolveRetiredModel('google', null)).toBe(null)
	})
})
