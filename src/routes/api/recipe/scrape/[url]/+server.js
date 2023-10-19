// file: src/routes/api/recipe/scrape/[url].js

import { parseURL } from '$lib/utils/parse/recipeParse'

export async function GET(request) {
	const { url } = request.params
	try {
		const scrapedRecipe = await parseURL(decodeURIComponent(url))
		return new Response(JSON.stringify(scrapedRecipe), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (err) {
		console.error(err)
		return new Response(JSON.stringify({ message: 'Could not scrape the recipe.' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
