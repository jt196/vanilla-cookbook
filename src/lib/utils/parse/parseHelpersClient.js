import { nutritionProcess } from '$lib/utils/filters'

async function scrapeRecipeFromURL(url) {
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
		const scrapedRecipe = result.data
		return {
			name: scrapedRecipe.name,
			source: scrapedRecipe.author,
			source_url: scrapedRecipe.sourceUrl,
			cook_time: scrapedRecipe.cookTime,
			image_url: scrapedRecipe.imageUrl,
			prep_time: scrapedRecipe.prepTime,
			ingredients: scrapedRecipe.ingredients.join('\n'),
			directions: scrapedRecipe.instructions.join('\n\n'),
			description: scrapedRecipe.description.join('\n\n'),
			total_time: scrapedRecipe.totalTime,
			servings: scrapedRecipe.servings,
			nutritional_info: nutritionProcess(scrapedRecipe.nutrition)
		}
	} else {
		console.error('Error:', result.error)
		throw result.error
	}
}
