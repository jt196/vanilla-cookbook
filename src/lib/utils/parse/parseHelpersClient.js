import { nutritionProcess } from '$lib/utils/filters'
import { durationToText } from '$lib/utils/parse/parseHelpers'

export async function scrapeRecipeFromURL(url) {
	try {
		const response = await fetch(`/api/recipe/scrape/${encodeURIComponent(url)}`)
		if (response.ok) {
			const data = await response.json()
			return { success: true, data }
		} else {
			const errorData = await response.json()
			throw new Error(errorData.message || 'Error scraping recipe')
		}
	} catch (error) {
		console.error('Error scraping recipe:', error.message)
		return { success: false, error: error.message }
	}
}

export async function handleScrape(event = null, url) {
	if (event) event.preventDefault()

	const result = await scrapeRecipeFromURL(url)

	if (result.success) {
		const raw = result.data
		const formatted = formatScrapedRecipe(raw)

		// Preserve _source and _status from raw
		return {
			...formatted,
			_source: raw._source,
			_status: raw._status
		}
	} else {
		console.error('Error:', result.error)
		throw result.error
	}
}

// Reusable formatting function for both methods
export function formatScrapedRecipe(raw) {
	return {
		name: raw.name,
		source: raw.author,
		source_url: raw.sourceUrl,
		cook_time: durationToText(raw.cookTime),
		image_url: raw.imageUrl,
		prep_time: durationToText(raw.prepTime),
		ingredients: Array.isArray(raw.ingredients) ? raw.ingredients.join('\n') : raw.ingredients,
		directions: Array.isArray(raw.instructions) ? raw.instructions.join('\n\n') : raw.instructions,
		description: Array.isArray(raw.description) ? raw.description.join('\n\n') : raw.description,
		total_time: durationToText(raw.totalTime),
		servings: Array.isArray(raw.servings) ? raw.servings[0] : raw.servings,
		nutritional_info: nutritionProcess(raw.nutrition)
	}
}
