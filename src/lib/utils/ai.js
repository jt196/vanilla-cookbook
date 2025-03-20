// src/lib/utils/ai/ai.js
import OpenAI from 'openai'
import { env } from '$env/dynamic/private'

const OPENAI_API_KEY = env.OPENAI_API_KEY
const OPENAI_API_ENGINE = env.OPENAI_API_ENGINE || 'gpt-3.5-turbo'

export async function gptExtractRecipe(html, url) {
	if (env.OPENAI_API_ENABLED !== 'true') {
		console.warn('⚠️ OpenAI API is disabled in this environment. Skipping AI extraction.')
		throw new Error('OpenAI API is disabled in this environment')
	}

	if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-xxxxxxxxxxxxxxxxxxxxxxxxx') {
		console.warn('⚠️ No OpenAI API key provided. Skipping AI extraction.')
		throw new Error('Missing OpenAI API key.')
	}

	const openai = new OpenAI({
		apiKey: OPENAI_API_KEY
	})

	const openaiEngine = OPENAI_API_ENGINE ? OPENAI_API_ENGINE : 'gpt-3.5-turbo'

	const maxChars = 40000 // Number of characters submitted to LLM
	const trimmedHtml = html.substring(0, maxChars)

	const prompt = `
    You are a recipe extraction AI. Extract recipe data from the HTML below and return it as a JSON object.
    
    Instructions:
    1. If a Schema.org Recipe JSON-LD object exists in the HTML, extract data from it.
    2. If recipeIngredient or recipeInstructions are missing, parse the HTML for ingredient lists and steps.
        - Synonyms for "instructions" might be "description" or "steps". 
    3. Populate all fields if the data exists, otherwise, "".
    4. Keep ingredients exactly as written in the source — do NOT convert units or values.
    5. If you can't find data, DO NOT make up anything, do not add any data that doesn't exist in the HTML. 
    
    Template format:
    {
      "name": "",
      "author": "",
      "sourceUrl": "",
      "imageUrl": "",
      "description": "",
      "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
      "instructions": ["Step 1", "Step 2", "Step 3"],
      "cookTime": "",
      "prepTime": "",
      "totalTime": "",
      "servings": "",
      "nutrition": {}
    }
    
    Respond with RAW JSON only. Do NOT use code blocks or Markdown.
    
    HTML:
    """${trimmedHtml}"""
    URL: ${url}
    `

	try {
		const chat = await openai.chat.completions.create({
			model: openaiEngine,
			messages: [
				{ role: 'system', content: 'You are an expert recipe parsing AI.' },
				{ role: 'user', content: prompt }
			],
			temperature: 0.3
		})

		let content = chat.choices[0].message.content.trim()

		console.log('Raw GPT Response:', content)

		// Remove Markdown code block if GPT included it
		if (content.startsWith('```')) {
			content = content.replace(/```json\s*|\s*```/g, '')
		}

		// 🧹 Clean up trailing commas before closing array/object brackets
		content = content.replace(/,\s*([\]}])/g, '$1')

		// Remove code block wrapper if present
		if (content.startsWith('```')) {
			content = content.replace(/```json\s*|\s*```/g, '')
		}

		const recipeJSON = JSON.parse(content)
		return recipeJSON
	} catch (error) {
		console.error('AI Parsing Failed:', error)
		throw new Error('AI parsing failed')
	}
}
