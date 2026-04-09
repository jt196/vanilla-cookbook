import { json } from '@sveltejs/kit'
import { requireAdmin } from '$lib/server/authHelpers'
import { testProviderConnection, getConfiguredProviders } from '$lib/utils/llmConnection'

/**
 * Test LLM provider connection.
 *
 * POST /api/llm/test
 * Body: { provider: string, model?: string, type?: 'chat' | 'embedding' | 'imageGeneration' }
 * Response: { ok: boolean, latencyMs: number, error?: string, model?: string }
 */
export async function POST({ request, locals }) {
	requireAdmin(locals)

	try {
		const body = await request.json()
		const { provider, model, type = 'chat' } = body

		if (!provider) {
			return json(
				{ ok: false, error: 'Provider is required', code: 'admin.site.msg.providerRequired' },
				{ status: 400 }
			)
		}

		const validProviders = ['openai', 'anthropic', 'google', 'ollama']
		if (!validProviders.includes(provider)) {
			return json(
				{
					ok: false,
					error: `Invalid provider: ${provider}`,
					code: 'admin.site.msg.invalidProvider'
				},
				{ status: 400 }
			)
		}

		const validTypes = ['chat', 'embedding', 'imageGeneration']
		if (!validTypes.includes(type)) {
			return json(
				{ ok: false, error: `Invalid type: ${type}`, code: 'admin.site.msg.invalidTestType' },
				{ status: 400 }
			)
		}

		const result = await testProviderConnection(provider, model, type)
		return json(result)
	} catch (err) {
		console.error('LLM test endpoint error:', err)
		return json(
			{
				ok: false,
				error: err instanceof Error ? err.message : 'Unknown error',
				code: 'admin.site.msg.connectionFailed'
			},
			{ status: 500 }
		)
	}
}

/**
 * Get configured providers.
 *
 * GET /api/llm/test
 * Response: { chat: string[], embedding: string[] }
 */
export async function GET({ locals }) {
	requireAdmin(locals)

	try {
		const providers = getConfiguredProviders()
		return json(providers)
	} catch (err) {
		console.error('LLM test endpoint error:', err)
		return json(
			{ error: 'Failed to get providers', code: 'admin.site.msg.providersLoadFail' },
			{ status: 500 }
		)
	}
}
