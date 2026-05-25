import { extractRecipeWithLLM, generateRecipeWithLLM } from '$lib/utils/ai'
import { json } from '@sveltejs/kit'
import { resolveAIConfig } from '$lib/server/aiHelpers'

export async function POST({ request, locals }) {
	try {
		const aiConfig = resolveAIConfig(locals, 'text')
		if (!aiConfig.ok) {
			return aiConfig.response
		}

		const { text, mode = 'parse', unitsPreference, language = 'eng' } = await request.json()

		if (!text || typeof text !== 'string') {
			return json(
				{ error: 'Invalid or missing text field.', code: 'recipeNew.msg.parseInvalidText' },
				{ status: 400 }
			)
		}

		const recipe =
			mode === 'prompt'
				? await generateRecipeWithLLM({
						prompt: text,
						provider: aiConfig.provider,
						model: aiConfig.model || undefined,
						unitsPreference,
						language
					})
				: await extractRecipeWithLLM({
						provider: aiConfig.provider,
						model: aiConfig.model || undefined,
						type: 'text',
						content: text,
						language
					})

		if (recipe?._noRecipe) {
			return json(
				{ error: 'No recipe content found in the text.', code: 'recipeNew.msg.parseNoRecipe' },
				{ status: 422 }
			)
		}

		if (!recipe || !recipe.name || !recipe.ingredients?.length) {
			return json(
				{ error: 'Recipe parsing incomplete.', code: 'recipeNew.msg.parseIncomplete' },
				{ status: 422 }
			)
		}

		return json({ ...recipe, _source: 'AI', _status: 'complete' })
	} catch (err) {
		console.error('Text parse API failed:', err)
		return json(
			{ error: 'Failed to parse recipe.', code: 'recipeNew.msg.parseFailed' },
			{ status: 500 }
		)
	}
}
