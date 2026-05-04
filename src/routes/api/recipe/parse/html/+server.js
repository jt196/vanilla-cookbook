import { json } from '@sveltejs/kit'
import { parseHTML } from '$lib/utils/parse/recipeParse'

export async function POST({ request }) {
	const formData = await request.formData()
	const file = formData.get('html')

	if (!file) {
		return json({ error: 'No HTML file provided', code: 'recipeNew.msg.noFile' }, { status: 400 })
	}

	const html = await file.text()

	if (!html.trim()) {
		return json({ error: 'HTML file is empty', code: 'recipeNew.msg.noFile' }, { status: 400 })
	}

	try {
		const result = await parseHTML(html, '')

		// parseHTML returns a string on parse failure
		if (typeof result === 'string') {
			return json({ error: result, code: 'recipeNew.msg.htmlError' }, { status: 422 })
		}

		const hasName = !!result.name
		const hasIngredients = Array.isArray(result.ingredients) && result.ingredients.length > 0
		const hasInstructions = Array.isArray(result.instructions) && result.instructions.length > 0
		const isComplete = hasName && hasIngredients && hasInstructions
		const hasAny = hasName || hasIngredients || hasInstructions

		if (!hasAny) {
			return json(
				{ error: 'No recipe data found in HTML.', code: 'recipeNew.msg.htmlError' },
				{ status: 422 }
			)
		}

		return json({ ...result, _source: 'scraper', _status: isComplete ? 'complete' : 'partial' })
	} catch (err) {
		console.error('HTML parsing failed:', err)
		return json(
			{ error: err?.message || 'Failed to parse HTML.', code: 'recipeNew.msg.htmlError' },
			{ status: 500 }
		)
	}
}
