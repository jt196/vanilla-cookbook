import { parseURL } from '$lib/utils/parse/recipeParse'
import { gptExtractRecipeFromContent } from '$lib/utils/ai'
import { env } from '$env/dynamic/private'

const OPENAI_API_KEY = env.OPENAI_API_KEY || 'sk-xxxxxxxxxxxxxxxxxxxxxxxxx'
const OPENAI_API_ENABLED = env.OPENAI_API_ENABLED || 'false'

export async function GET({ params }) {
	const url = decodeURIComponent(params.url)
	let scrapedRecipe = null
	let html = ''

	try {
		console.log('Attempting regular scrape...')
		const result = await parseURL(url)
		console.log('🚀 ~ GET ~ result:', result)
		scrapedRecipe = result.parsedHTML
		html = result.html

		if (
			scrapedRecipe &&
			typeof scrapedRecipe === 'object' &&
			scrapedRecipe.name &&
			scrapedRecipe.ingredients?.length > 0
		) {
			console.log('Regular scrape success.')
			return jsonResponse({ ...scrapedRecipe, _source: 'scraper', _status: 'complete' }, 200)
		}

		console.warn('Regular scrape incomplete.')
	} catch (err) {
		console.error('Regular scrape failed:', err)
	}

	// AI fallback
	if (OPENAI_API_KEY && html && OPENAI_API_ENABLED) {
		console.log('Attempting AI scrape...')
		try {
			const aiRecipe = await gptExtractRecipeFromContent(html, 'html', url)

			if (
				aiRecipe &&
				typeof aiRecipe === 'object' &&
				aiRecipe.name &&
				aiRecipe.ingredients?.length > 0
			) {
				console.log('AI scrape success.')
				return jsonResponse({ ...aiRecipe, _source: 'AI', _status: 'complete' }, 200)
			} else {
				console.warn('AI scrape incomplete, returning partial regular scrape.')
			}
		} catch (aiErr) {
			console.error('AI scrape failed:', aiErr)
		}
	} else {
		console.warn('No OpenAI API key or HTML missing, skipping AI scrape.')
	}

	// Return partial scrape if possible
	if (scrapedRecipe) {
		console.log('Partial scrape return.')
		return jsonResponse({ ...scrapedRecipe, _source: 'scraper', _status: 'partial' }, 200)
	}

	// Total fail
	return jsonResponse({ message: 'Could not scrape the recipe.' }, 500)
}

function jsonResponse(data, status) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' }
	})
}
