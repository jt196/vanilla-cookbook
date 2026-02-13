import { translateRecipeWithLLM } from '$lib/utils/ai'
import { json } from '@sveltejs/kit'
import { resolveAIConfig } from '$lib/server/aiHelpers'

export async function POST({ request, locals }) {
	try {
		const aiConfig = resolveAIConfig(locals, 'text')
		if (!aiConfig.ok) {
			return aiConfig.response
		}

		const { recipe, language = 'eng', fromLanguage = null } = await request.json()

		if (!recipe || typeof recipe !== 'object') {
			return json({ error: 'Missing recipe.' }, { status: 400 })
		}

		const response = await translateRecipeWithLLM({
			recipe,
			provider: aiConfig.provider,
			model: aiConfig.model || undefined,
			language,
			fromLanguage
		})

		if (!response || typeof response !== 'object') {
			return json({ error: 'Translation failed - invalid response format.' }, { status: 422 })
		}

		return json({ recipe: response })
	} catch (err) {
		console.error('Translate API failed:', err)
		return json({ error: 'Failed to translate recipe.' }, { status: 500 })
	}
}
