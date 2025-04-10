import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { env } from '$env/dynamic/private'

/**
 * Converts a Buffer to a base64 encoded image data URI.
 * @param {Buffer} buffer - Input buffer
 * @param {string} mimeType - MIME type of the image
 * @returns {string} A base64 encoded image data URI
 */
function bufferToBase64ImageDataURI(buffer, mimeType) {
	const base64 = buffer.toString('base64')
	return `data:${mimeType};base64,${base64}`
}

/**
 * Builds a prompt for a recipe extraction AI from the given inputLabel and content.
 *
 * Returns a string prompt that includes the content and any relevant information
 * such as a URL if the inputLabel is 'HTML'.
 *
 * The generated prompt will instruct the AI to:
 * 1. Check for structured data in the content.
 * 2. Parse the content like user-pasted recipe text or OCR from an image.
 * 3. Populate all fields that exist. Use empty strings or arrays if data is missing.
 * 4. Never guess or fabricate values.
 * 5. Return raw JSON only, no Markdown or code formatting.
 * 6. Return ingredients and instructions/directions as arrays of strings.
 * 7. Each ingredient to be a separate array element.
 * 8. Each instruction paragraph to be a separate array element.
 *
 * @param {string} [inputLabel='Text'] - The label for the content.
 * @param {string} [content=''] - The content to extract from.
 * @param {string} [url=''] - A URL to include in the prompt.
 * @returns {string} The generated prompt.
 */
function buildRecipePrompt(inputLabel = 'Text', content = '', url = '') {
	const blockType = inputLabel
	const urlLine = inputLabel.toLowerCase() === 'html' && url ? `\nURL: ${url}` : ''
	const trimmedContent = content?.substring(0, 40000) || ''

	return `
You are a recipe extraction AI. Extract recipe data from the ${blockType} below and return it as a JSON object.

Instructions:
1. If the content is HTML, check for structured data like Schema.org Recipe JSON-LD.
2. Otherwise, parse it like user-pasted recipe text or OCR from an image.
3. Populate all fields that exist. Use empty strings or arrays if data is missing.
4. Never guess or fabricate values.
5. Return raw JSON only, no Markdown or code formatting.
6. Return ingredients and instructions/directions as arrays of strings.
7. Each ingredient to be a separate array element.
8. Each instruction paragraph to be a separate array element.

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

${blockType}:
"""${trimmedContent}"""${urlLine}`
}

/**
 * Extract a recipe from the given content using a Large Language Model (LLM).
 *
 * @param {Object} options - Options to control the extraction.
 * @param {string} [options.provider=openai] - The provider of the LLM.
 * @param {string} [options.content=''] - The content to extract the recipe from.
 * @param {string} [options.type=html] - The type of the content, either 'html' or 'text'.
 * @param {string} [options.url=''] - The URL of the content, used for HTML content.
 * @param {Buffer} [options.imageBuffer] - The image data to extract the recipe from.
 * @param {string} [options.imageMimeType] - The MIME type of the image data.
 *
 * @throws {Error} If the LLM API is disabled or the OpenAI API key is missing.
 * @throws {Error} If the provider is not supported.
 * @throws {Error} If the image data is missing.
 *
 * @returns {Promise<Object>} A promise that resolves to the extracted recipe as a JSON object.
 */
export async function extractRecipeWithLLM({
	provider = 'openai',
	content = '',
	type = 'html',
	url = '',
	imageBuffer,
	imageMimeType
}) {
	if (env.LLM_API_ENABLED !== 'true') throw new Error('LLM API is disabled')
	if (!env.OPENAI_API_KEY) throw new Error('Missing OpenAI API key')

	const model =
		type === 'image'
			? env.LLM_API_ENGINE_IMAGE || 'gpt-4o'
			: env.LLM_API_ENGINE_TEXT || 'gpt-3.5-turbo'

	if (provider !== 'openai') throw new Error(`Unsupported provider: ${provider}`)

	const chat = new ChatOpenAI({
		modelName: model,
		openAIApiKey: env.OPENAI_API_KEY,
		temperature: 0.3
	})

	const messages = []

	messages.push(new SystemMessage('You are an expert recipe extraction AI.'))

	if (type === 'image') {
		if (!imageBuffer || !imageMimeType) {
			throw new Error('Missing image data')
		}

		const imageDataURI = bufferToBase64ImageDataURI(imageBuffer, imageMimeType)
		const fullPrompt = buildRecipePrompt('Image')

		messages.push(
			new HumanMessage({
				content: [
					{ type: 'text', text: fullPrompt },
					{ type: 'image_url', image_url: { url: imageDataURI } }
				]
			})
		)
	} else {
		const trimmedContent = content.substring(0, 40000)
		const blockType = type === 'html' ? 'HTML' : 'Text'
		const prompt = buildRecipePrompt(blockType, trimmedContent, url)

		messages.push(new HumanMessage(prompt))
	}

	try {
		const result = await chat.invoke(messages)
		let output = result.content.trim()

		if (output.startsWith('```')) {
			output = output.replace(/```json\s*|\s*```/g, '')
		}
		output = output.replace(/,\s*([\]}])/g, '$1')

		return JSON.parse(output)
	} catch (err) {
		console.error('LLM recipe parse failed:', err)
		throw new Error('LLM parsing error')
	}
}
