import { languageLabels } from '$lib/submodules/recipe-ingredient-parser/src/i18n'

export const RECIPE_JSON_SHAPE = `{
  "name": "",
  "author": "",
  "sourceUrl": "",
  "imageUrl": "",
  "description": "",
  "notes": "",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["Step 1", "Step 2"],
  "cookTime": "",
  "prepTime": "",
  "totalTime": "",
  "servings": "",
  "nutrition": {}
}`

const languageMap = languageLabels

export function buildRecipeExtractionPrompt({
	inputLabel = 'Text',
	content = '',
	url = '',
	language = 'eng'
} = {}) {
	const blockType = inputLabel
	const urlLine = inputLabel.toLowerCase() === 'html' && url ? `\nURL: ${url}` : ''
	const trimmedContent = content?.substring(0, 40000) || ''
	const languageName = languageMap[language] || 'English'
	const isText = inputLabel.toLowerCase() === 'text'
	const htmlInstruction = inputLabel.toLowerCase() === 'html'
		? '1. If the content is HTML, check for structured data like Schema.org Recipe JSON-LD.'
		: '1. Parse the content like user-pasted recipe text or OCR from an image.'
	const noRecipeInstruction = isText
		? '\nIMPORTANT: If the text does not contain actual recipe ingredients or cooking instructions, return ONLY: {"_noRecipe": true}'
		: ''

	return `
You are a recipe extraction AI. Extract recipe data from the ${blockType} below and return it as a JSON object.

Instructions:
${htmlInstruction}
2. Populate all fields that exist. Use empty strings or arrays if data is missing.
3. Never guess or fabricate values.
4. Return raw JSON only, no Markdown or code formatting.
5. Return ingredients and instructions/directions as arrays of strings.
6. Each ingredient to be a separate array element.
7. Each instruction paragraph to be a separate array element.
8. Format ingredients following these rules:
   - Use decimal numbers (1.5 kg) instead of fractions (1 1/2 kg)
   - Avoid prepositions like "of" (write "1.5 kg flour" not "1.5 kg of flour")
   - Place extra preparation information after a comma (e.g., "1.5 kg flour, sifted")
   - Avoid using "or" for alternative ingredients (pick one ingredient instead of "1.5 kg strong flour or all-purpose flour")
9. Output the recipe in ${languageName}. Translate ingredient and instruction text if necessary.${noRecipeInstruction}

Expected format (when recipe is found):
${RECIPE_JSON_SHAPE}

${blockType}:
"""${trimmedContent}"""${urlLine}`
}

/**
 * Prompt for extracting a recipe from a YouTube video description or transcript.
 * Adds an explicit _noRecipe escape hatch so the AI can signal "no recipe here"
 * rather than fabricating one, which drives stage progression in the YouTube pipeline.
 *
 * @param {{ content?: string, url?: string }} options
 * @returns {string}
 */
export function buildVideoTextExtractionPrompt({ content = '', url = '', language = 'eng' } = {}) {
	const trimmedContent = content.substring(0, 40000)
	const urlLine = url ? `\nSource URL: ${url}` : ''
	const languageName = languageMap[language] || 'English'

	return `
You are a recipe extraction AI. Extract recipe data from the video text below and return it as a JSON object.

Instructions:
1. Parse the content for recipe ingredients and cooking instructions.
2. Populate all fields that exist. Use empty strings or arrays if data is missing.
3. Never guess or fabricate values.
4. Return raw JSON only, no Markdown or code formatting.
5. Return ingredients and instructions/directions as arrays of strings.
6. Each ingredient to be a separate array element.
7. Each instruction paragraph to be a separate array element.
8. Format ingredients following these rules:
   - Use decimal numbers (1.5 kg) instead of fractions (1 1/2 kg)
   - Avoid prepositions like "of" (write "1.5 kg flour" not "1.5 kg of flour")
   - Place extra preparation information after a comma (e.g., "1.5 kg flour, sifted")
   - Avoid using "or" for alternative ingredients (pick one ingredient instead of "1.5 kg strong flour or all-purpose flour")
9. Output the recipe in ${languageName}. Translate ingredient and instruction text if necessary.
IMPORTANT: If the text does not contain actual recipe ingredients or cooking instructions, return ONLY: {"_noRecipe": true}

Expected format (when recipe is found):
${RECIPE_JSON_SHAPE}

Video text:
"""${trimmedContent}"""${urlLine}`
}

export function parseRecipeJsonOutput(rawOutput) {
	let output = (rawOutput || '').trim()

	if (output.startsWith('```')) {
		output = output.replace(/```json\s*|\s*```/g, '')
	}

	output = output.replace(/,\s*([\]}])/g, '$1')

	const jsonMatch = output.match(/\{[\s\S]*\}/)
	if (jsonMatch) {
		output = jsonMatch[0]
	}

	try {
		return JSON.parse(output)
	} catch (parseErr) {
		const openBraces = (output.match(/\{/g) || []).length
		const closeBraces = (output.match(/\}/g) || []).length
		const openBrackets = (output.match(/\[/g) || []).length
		const closeBrackets = (output.match(/\]/g) || []).length

		if (openBraces > closeBraces || openBrackets > closeBrackets) {
			const lastCompleteMatch = output.match(
				/^([\s\S]*(?:"\s*,|"\s*$|\]\s*,|\]\s*$|\d\s*,|\d\s*$|true\s*,|true\s*$|false\s*,|false\s*$|null\s*,|null\s*$))/
			)

			if (lastCompleteMatch) {
				output = lastCompleteMatch[1].trim().replace(/,\s*$/, '')
			}

			for (let i = 0; i < openBrackets - closeBrackets; i += 1) output += ']'
			for (let i = 0; i < openBraces - closeBraces; i += 1) output += '}'

			return JSON.parse(output)
		}

		throw parseErr
	}
}
