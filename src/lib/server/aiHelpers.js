import { jsonError } from '$lib/server/authHelpers'

/**
 * Resolve effective AI provider/model for an API request from hook-populated locals.
 *
 * @param {import('@sveltejs/kit').RequestEvent['locals']} locals
 * @param {'text' | 'image'} [type='text']
 * @returns {{ ok: true, provider: string, model: string | null } | { ok: false, response: Response }}
 */
export function resolveAIConfig(locals, type = 'text') {
	const ai = locals?.site?.ai

	if (!ai?.enabled) {
		return { ok: false, response: jsonError(503, 'AI features are disabled.') }
	}

	const provider = type === 'image' ? ai.imageProvider || ai.provider : ai.provider
	if (!provider) {
		return {
			ok: false,
			response: jsonError(500, `No AI ${type} provider configured.`)
		}
	}

	const availableProviders = ai.availableProviders || []
	if (!availableProviders.includes(provider)) {
		return {
			ok: false,
			response: jsonError(
				503,
				`Selected AI provider "${provider}" is not configured in the environment.`
			)
		}
	}

	if (type === 'image' && provider === 'ollama') {
		return {
			ok: false,
			response: jsonError(400, 'Selected AI provider does not support image parsing.')
		}
	}

	const model = type === 'image' ? ai.imageModel || null : ai.textModel || null

	return { ok: true, provider, model }
}
