// src/lib/utils/ai/ai.js
import OpenAI from 'openai'
import { env } from '$env/dynamic/private'

const OPENAI_API_KEY = env.OPENAI_API_KEY
const OPENAI_API_ENGINE = env.OPENAI_API_ENGINE || 'gpt-3.5-turbo'

export async function gptExtractRecipeFromContent(content, type = 'html', url = '') {
	// Validation
	if (env.OPENAI_API_ENABLED !== 'true') throw new Error('OpenAI API is disabled')
	if (!OPENAI_API_KEY) throw new Error('Missing OpenAI API key')

	const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

	// Trim the content if needed
	const maxChars = 40000
	const trimmedContent = content.substring(0, maxChars)

	// Dynamic prompt intro
	const inputTypeLabel = type === 'html' ? 'HTML' : 'Text'
	const inputBlockLabel = type === 'html' ? 'HTML' : 'Text'
	const urlLine = type === 'html' && url ? `\nURL: ${url}` : ''

	const prompt = `
You are a recipe extraction AI. Extract recipe data from the ${inputTypeLabel} below and return it as a JSON object.

Instructions:
1. If the content is HTML, check for structured data like Schema.org Recipe JSON-LD.
2. Otherwise, parse it like user-pasted recipe text.
3. Populate all fields that exist. Use empty strings or arrays if data is missing.
4. Never guess or fabricate values.
5. Return raw JSON only, no Markdown or code formatting.

Expected format:
{
  "name": "",
  "author": "",
  "sourceUrl": "",
  "imageUrl": "",
  "description": "",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["Step 1", "Step 2"],
  "cookTime": "",
  "prepTime": "",
  "totalTime": "",
  "servings": "",
  "nutrition": {}
}

${inputBlockLabel}:
"""${trimmedContent}"""${urlLine}
`

	try {
		const chat = await openai.chat.completions.create({
			model: OPENAI_API_ENGINE,
			messages: [
				{ role: 'system', content: 'You are an expert recipe extraction AI.' },
				{ role: 'user', content: prompt }
			],
			temperature: 0.3
		})

		let output = chat.choices[0].message.content.trim()

		if (output.startsWith('```')) {
			output = output.replace(/```json\s*|\s*```/g, '')
		}

		output = output.replace(/,\s*([\]}])/g, '$1')

		return JSON.parse(output)
	} catch (error) {
		console.error('AI Content Parse Error:', error)
		throw new Error('AI content parsing failed')
	}
}
