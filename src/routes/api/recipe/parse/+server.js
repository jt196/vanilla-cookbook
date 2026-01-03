import { extractRecipeWithLLM, generateRecipeWithLLM } from '$lib/utils/ai'
import { json } from '@sveltejs/kit'

export async function POST({ request }) {
	try {
		const { text, mode = 'parse', unitsPreference, language = 'eng' } = await request.json()

		if (!text || typeof text !== 'string') {
			return json({ error: 'Invalid or missing text field.' }, { status: 400 })
		}

		const recipe =
			mode === 'prompt'
				? await generateRecipeWithLLM({
						prompt: text,
						unitsPreference,
						language
					})
				: await extractRecipeWithLLM({
						type: 'text',
						content: text,
						language
					})

		if (!recipe || !recipe.name || !recipe.ingredients?.length) {
			return json({ error: 'Recipe parsing incomplete.' }, { status: 422 })
		}

		return json({ ...recipe, _source: 'AI', _status: 'complete' })
	} catch (err) {
		console.error('Text parse API failed:', err)
		return json({ error: 'Failed to parse recipe.' }, { status: 500 })
	}
}
