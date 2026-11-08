import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveAi, resolveOAuth, resolveSemantic, resolveSiteConfig } from '$lib/server/siteConfig'

beforeEach(() => {
	vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('resolveOAuth', () => {
	it('enables providers only when both id and secret are set', () => {
		expect(
			resolveOAuth({ GITHUB_CLIENT_ID: 'id', GITHUB_CLIENT_SECRET: 's', GOOGLE_CLIENT_ID: 'id' })
		).toEqual({
			githubEnabled: true,
			googleEnabled: false,
			oidcEnabled: false,
			oidcName: 'OIDC',
			oauthEnabled: true
		})
	})

	it('needs all three OIDC values and uses OIDC_NAME', () => {
		const oauth = resolveOAuth({
			OIDC_ISSUER_URL: 'https://idp',
			OIDC_CLIENT_ID: 'id',
			OIDC_CLIENT_SECRET: 's',
			OIDC_NAME: ' Authentik '
		})
		expect(oauth).toMatchObject({ oidcEnabled: true, oidcName: 'Authentik', oauthEnabled: true })
	})
})

describe('resolveAi', () => {
	const keys = { OPENAI_API_KEY: 'k', ANTHROPIC_API_KEY: 'k' }

	it('is disabled with no API keys even if the site enables it', () => {
		const ai = resolveAi({ llmEnabled: true }, {})
		expect(ai).toMatchObject({ enabled: false, hasAnyApiKey: false, provider: null })
	})

	it('uses the DB setting over LLM_API_ENABLED', () => {
		expect(resolveAi({ llmEnabled: false }, { ...keys, LLM_API_ENABLED: 'true' }).enabled).toBe(
			false
		)
		expect(resolveAi({}, { ...keys, LLM_API_ENABLED: 'yes' }).enabled).toBe(true)
	})

	it('uses the preferred provider and its configured models', () => {
		const ai = resolveAi(
			{
				llmEnabled: true,
				llmProvider: 'anthropic',
				llmTextModel: 'claude-x',
				llmImageModel: 'claude-v'
			},
			keys
		)
		expect(ai).toMatchObject({
			provider: 'anthropic',
			selectedProvider: 'anthropic',
			selectedProviderConfigured: true,
			imageProvider: 'anthropic',
			textModel: 'claude-x',
			imageModel: 'claude-v',
			imageAllowed: true,
			modelMissing: false
		})
	})

	it('falls back to an available provider, drops its models and warns', () => {
		const ai = resolveAi(
			{ llmEnabled: true, llmProvider: 'google', llmTextModel: 'gemini' },
			{ OPENAI_API_KEY: 'k' }
		)
		expect(ai).toMatchObject({
			provider: 'openai',
			selectedProvider: 'google',
			selectedProviderConfigured: false,
			textModel: null,
			modelMissing: true
		})
		expect(console.warn).toHaveBeenCalledWith(
			'AI provider "google" is selected but not configured in environment. Falling back to "openai".'
		)
	})

	it('falls back to env model names, including the legacy LLM_API_ENGINE_* ones', () => {
		const env = { ...keys, LLM_PROVIDER: 'openai', LLM_API_ENGINE_TEXT: 'gpt-old' }
		expect(resolveAi({ llmEnabled: true }, env).textModel).toBe('gpt-old')
		expect(resolveAi({ llmEnabled: true }, { ...env, LLM_TEXT_MODEL: 'gpt-new' }).textModel).toBe(
			'gpt-new'
		)
	})

	it('resolves image and image-generation providers separately', () => {
		const ai = resolveAi(
			{
				llmEnabled: true,
				llmProvider: 'ollama',
				llmImageProvider: 'openai',
				llmImageGenerationProvider: 'openai',
				llmImageGenerationModel: 'gpt-image'
			},
			{ OLLAMA_BASE_URL: 'http://localhost:11434', OPENAI_API_KEY: 'k' }
		)
		expect(ai).toMatchObject({
			provider: 'ollama',
			imageProvider: 'openai',
			imageAllowed: true,
			imageGenerationProvider: 'openai',
			imageGenerationModel: 'gpt-image'
		})
	})

	it('does not allow image parsing with Ollama', () => {
		const ai = resolveAi(
			{ llmEnabled: true, llmProvider: 'ollama' },
			{ OLLAMA_BASE_URL: 'http://localhost:11434' }
		)
		expect(ai.imageAllowed).toBe(false)
	})
})

describe('resolveSemantic', () => {
	it('needs both the site setting and an embedding provider', () => {
		expect(resolveSemantic({ semanticEnabled: true }, {})).toMatchObject({
			enabled: false,
			enabledBySite: true,
			providerAvailable: false
		})
		expect(resolveSemantic({ semanticEnabled: true }, { OPENAI_API_KEY: 'k' })).toMatchObject({
			enabled: true,
			provider: 'openai'
		})
	})

	it('reports an unconfigured selected provider', () => {
		const semantic = resolveSemantic(
			{ semanticEnabled: true, semanticEmbeddingProvider: 'google', semanticEmbeddingModel: 'm' },
			{ OPENAI_API_KEY: 'k' }
		)
		expect(semantic).toMatchObject({
			enabled: false,
			provider: null,
			selectedProvider: 'google',
			selectedProviderConfigured: false,
			availableProviders: ['openai'],
			model: 'm'
		})
	})
})

describe('resolveSiteConfig', () => {
	it('returns safe defaults before setup', () => {
		const site = resolveSiteConfig({
			seeded: false,
			settingsRow: null,
			env: { OPENAI_API_KEY: 'k' }
		})
		expect(site.dbSeeded).toBe(false)
		expect(site.settings).toEqual({ registrationAllowed: false, requireLogin: false })
		expect(site.ai).toMatchObject({ enabled: false, hasAnyApiKey: true, provider: null })
		expect(site.semantic).toMatchObject({ enabled: false, provider: 'openai' })
	})

	it('lets REGISTRATION_ALLOWED override the DB setting', () => {
		const row = { registrationAllowed: true, requireLogin: true }
		expect(
			resolveSiteConfig({ seeded: true, settingsRow: row, env: { REGISTRATION_ALLOWED: 'false' } })
				.settings
		).toMatchObject({ registrationAllowed: false, requireLogin: true })
		expect(
			resolveSiteConfig({ seeded: true, settingsRow: row, env: {} }).settings.registrationAllowed
		).toBe(true)
	})
})
