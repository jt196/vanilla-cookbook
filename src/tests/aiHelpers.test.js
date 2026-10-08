import { describe, expect, it } from 'vitest'
import { resolveAIConfig } from '$lib/server/aiHelpers'

const site = (ai) => ({
	site: { ai: { enabled: true, provider: 'google', availableProviders: ['google'], ...ai } }
})

describe('resolveAIConfig', () => {
	it('returns the provider and model when a text model is set', () => {
		expect(resolveAIConfig(site({ textModel: 'gemini-x' }), 'text')).toEqual({
			ok: true,
			provider: 'google',
			model: 'gemini-x'
		})
	})

	it('points admins at Site Settings when no model is set', async () => {
		const result = resolveAIConfig({ ...site({}), user: { isAdmin: true } }, 'text')
		expect(result.ok).toBe(false)
		expect(result.response.status).toBe(503)
		expect(await result.response.json()).toMatchObject({ code: 'aiSetup.noModelAdmin' })
	})

	it('tells other users to ask an admin when no model is set', async () => {
		const result = resolveAIConfig({ ...site({}), user: { isAdmin: false } }, 'image')
		expect(result.ok).toBe(false)
		expect(await result.response.json()).toMatchObject({ code: 'aiSetup.noModelUser' })
	})

	it('leaves image generation to its own model check', () => {
		const result = resolveAIConfig(site({}), 'imageGeneration')
		expect(result).toMatchObject({ ok: true, provider: 'google', model: null })
	})
})
