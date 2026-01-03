import { generateRecipeWithLLM } from '$lib/utils/ai'
import { json } from '@sveltejs/kit'

export async function POST({ request }) {
	try {
		const { type, content, userUnits = 'metric', language = 'eng' } = await request.json()

		if (!type || !content) {
			return json({ error: 'Missing type or content.' }, { status: 400 })
		}

		let prompt = ''
		let systemMessage = ''

		if (type === 'ingredients') {
			systemMessage = 'You are an ingredient formatting AI.'
			prompt = `Clean up the following ingredient list according to these rules:

1. If there are dual units (metric and imperial), only keep the ${userUnits === 'metric' ? 'metric' : userUnits === 'americanVolumetric' ? 'US volumetric' : 'imperial'} unit
   Example: "28g (1oz) flour" → "28g flour"
2. Move alternative ingredients after a comma with "or"
   Example: "1 tomato or 0.5 tin tomatoes" → "1 tomato, or 0.5 tin tomatoes"
3. Remove brackets and double brackets, keeping info after comma
   Example: "200g flour (sifted)" → "200g flour, sifted"
4. Move preparation instructions after a comma
   Example: "1 onion (chopped)" → "1 onion, chopped"
5. Remove non-essential conversational text, keep only ingredient data
6. Use decimal numbers (1.5 kg) instead of fractions
7. Avoid prepositions like "of" (write "1.5 kg flour" not "1.5 kg of flour")

Return ONLY a JSON object with an "ingredients" array (one cleaned ingredient per line).
Each line should be a separate array element.

Ingredients to clean:
"""${content}"""

Return format:
{
  "ingredients": ["cleaned ingredient 1", "cleaned ingredient 2"]
}`
		} else if (type === 'directions') {
			systemMessage = 'You are a recipe instruction simplification AI.'
			prompt = `These recipe instructions are too long and complex. Strip out all the extra explanations and pare them down to the bare essentials needed to cook this recipe.

Rules:
- No steps should be missed out
- Assume an intermediate level of culinary experience
- Remove conversational tone, tips, and extra explanations
- Keep only the essential actions needed to execute the recipe
- Maintain the same number of steps, just make each one more concise
- Each instruction should be a separate array element

Return ONLY a JSON object with an "instructions" array.

Directions to simplify:
"""${content}"""

Return format:
{
  "instructions": ["Step 1", "Step 2"]
}`
		} else {
			return json({ error: 'Invalid cleanup type.' }, { status: 400 })
		}

		// Use generateRecipeWithLLM for cleanup task
		const response = await generateRecipeWithLLM({
			prompt,
			unitsPreference: userUnits,
			language
		})

		// Extract the relevant field
		if (type === 'ingredients' && response.ingredients) {
			return json({ ingredients: response.ingredients })
		} else if (type === 'directions' && response.instructions) {
			return json({ instructions: response.instructions })
		} else {
			return json({ error: 'Cleanup failed - invalid response format.' }, { status: 422 })
		}
	} catch (err) {
		console.error('Cleanup API failed:', err)
		return json({ error: 'Failed to clean up content.' }, { status: 500 })
	}
}
