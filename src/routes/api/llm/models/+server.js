import { json } from '@sveltejs/kit'
import { requireAdmin } from '$lib/server/authHelpers'
import { listProviderModels } from '$lib/server/llmModelList'
import { providerNames } from '$lib/utils/llmModels'

const validTypes = ['chat', 'image', 'imageGeneration', 'embedding']

/**
 * List the models a provider currently offers, fetched live from the provider.
 *
 * GET /api/llm/models?provider=google&type=chat
 * Response: { ok: true, models: Array<{ value: string, label: string }> } | { ok: false, error: string }
 */
export async function GET({ url, locals }) {
	requireAdmin(locals)

	const provider = url.searchParams.get('provider') || ''
	const type = url.searchParams.get('type') || 'chat'

	if (!providerNames.includes(provider)) {
		return json({ ok: false, error: `Invalid provider: ${provider}` }, { status: 400 })
	}
	if (!validTypes.includes(type)) {
		return json({ ok: false, error: `Invalid type: ${type}` }, { status: 400 })
	}

	return json(await listProviderModels(provider, type))
}
