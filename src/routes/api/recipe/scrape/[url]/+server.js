import { parseURL } from '$lib/utils/parse/recipeParse'
import { extractRecipeWithLLM } from '$lib/utils/ai'
import { resolveAIConfig } from '$lib/server/aiHelpers'

export async function GET({ params, locals }) {
	const url = decodeURIComponent(params.url)
	let scrapedRecipe = null
	let html = ''

	try {
		console.log('Attempting regular scrape...')
		const result = await parseURL(url)
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
	if (html) {
		try {
			const aiConfig = resolveAIConfig(locals, 'text')
			if (!aiConfig.ok) {
				console.warn('AI scrape skipped: AI is unavailable for this request.')
			} else {
				console.log('Attempting AI scrape...')
				const aiRecipe = await extractRecipeWithLLM({
					provider: aiConfig.provider,
					model: aiConfig.model || undefined,
					type: 'html',
					content: html,
					url
				})
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
			}
		} catch (aiErr) {
			console.warn('AI scrape failed:', aiErr instanceof Error ? aiErr.message : String(aiErr))
		}
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
