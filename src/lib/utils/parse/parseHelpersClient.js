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
