import { ERRORS } from './parseErrors'
import {
	durationToText,
	getAuthor,
	getImage,
	getRating,
	getUrl,
	parseInstructions,
	parseVideo,
	parseRecipeToJSON,
	getNutrition
} from './parseHelpers'
import parse from 'node-html-parser'

export function parseRecipe(html) {
	try {
		const root = parse(html, {
			lowerCaseTagName: true
		})
		const jsonLDs = root.querySelectorAll("script[type='application/ld+json']") // This will get all JSON-LD scripts

		if (!jsonLDs || jsonLDs.length === 0) throw ERRORS.NO_JSON_LD

		let recipeRaw
		for (let jsonLD of jsonLDs) {
			recipeRaw = parseRecipeToJSON(jsonLD.rawText)
			if (recipeRaw && recipeRaw.name) break // If a valid recipe with a name is found, break out of the loop
		}

		if (!recipeRaw) throw ERRORS.PARSING_ERROR

		const recipe = {
			name: recipeRaw.name,
			author: getAuthor(recipeRaw.author),
			datePublished: recipeRaw.datePublished ? new Date(recipeRaw.datePublished) : undefined,
			sourceUrl: getUrl(recipeRaw),
			cookTime: recipeRaw.cookTime ? durationToText(recipeRaw.cookTime) : undefined,
			imageUrl: getImage(recipeRaw.image),
			keywords: recipeRaw.keywords ? recipeRaw.keywords.split(',').map((v) => v.trim()) : [],
			prepTime: recipeRaw.prepTime ? durationToText(recipeRaw.prepTime) : undefined,
			ingredients: recipeRaw.recipeIngredient,
			instructions: parseInstructions(recipeRaw.recipeInstructions),
			category: Array.isArray(recipeRaw.recipeCategory)
				? recipeRaw.recipeCategory
				: recipeRaw.recipeCategory
				? [recipeRaw.recipeCategory]
				: undefined,
			cuisine: Array.isArray(recipeRaw.recipeCuisine)
				? recipeRaw.recipeCuisine
				: recipeRaw.recipeCuisine
				? [recipeRaw.recipeCuisine]
				: undefined,
			rating: getRating(recipeRaw.aggregateRating),
			totalTime: recipeRaw.totalTime ? durationToText(recipeRaw.totalTime) : undefined,
			yeld: recipeRaw.recipeYield,
			...parseVideo(recipeRaw.video),
			nutrition: getNutrition(recipeRaw.nutrition)
		}

		if (!recipe.name || !recipe.imageUrl) {
			throw ERRORS.MISSING_DATA
		}

		return recipe
	} catch (error) {
		return typeof error === 'string' ? error : 'Unknown error'
	}
}

async function downloadHTML(url) {
	const response = await fetch(url)
	return response.text()
}

export async function parseHTML(html) {
	const recipe = parseRecipe(html)
	return recipe
}

export async function parseURL(url) {
	const html = await downloadHTML(url)
	const parsedHTML = await parseHTML(html)
	return parsedHTML
}
