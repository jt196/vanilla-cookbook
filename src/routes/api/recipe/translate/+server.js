import { translateRecipeWithLLM } from '$lib/utils/ai'
import { json } from '@sveltejs/kit'

export async function POST({ request }) {
	try {
		const { recipe, language = 'eng' } = await request.json()

		if (!recipe || typeof recipe !== 'object') {
			return json({ error: 'Missing recipe.' }, { status: 400 })
		}

		const response = await translateRecipeWithLLM({ recipe, language })

		if (!response || typeof response !== 'object') {
			return json({ error: 'Translation failed - invalid response format.' }, { status: 422 })
		}

		return json({ recipe: response })
	} catch (err) {
		console.error('Translate API failed:', err)
		return json({ error: 'Failed to translate recipe.' }, { status: 500 })
	}
}
