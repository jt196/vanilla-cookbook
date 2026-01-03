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
 * Dynamically load a chat model client based on provider.
 * Keeps bundling light and lets deployments install only the needed provider package.
 *
 * Supported providers (install the matching LangChain pkg):
 * - openai (@langchain/openai)
 * - anthropic (@langchain/anthropic)
 * - gemini (@langchain/google-genai)
 * - ollama (@langchain/ollama)
 *
 * @param {string} provider
 * @param {string} model
 * @param {string} type
 * @returns {Promise<import('@langchain/core/language_models/chat_models').BaseChatModel>}
 */
function resolveApiKey(provider) {
	const generic = env.LLM_API_KEY
	if (provider === 'openai') return env.OPENAI_API_KEY || generic
	if (provider === 'anthropic') return env.ANTHROPIC_API_KEY || generic
	if (provider === 'google') return env.GOOGLE_API_KEY || generic
	return generic
}

function makeProviderLoader({ provider, importPath, clientName, buildConfig }) {
	return async (model, type) => {
		const apiKey = resolveApiKey(provider)
		if (apiKey === undefined || apiKey === null || apiKey === '') {
			throw new Error(`Missing ${provider} API key`)
		}
		const mod = await import(importPath)
		const Client = mod[clientName]
		if (!Client) throw new Error(`Client ${clientName} not found in ${importPath}`)
		return new Client(buildConfig(model, apiKey, type))
	}
}

const providerLoaders = {
	openai: makeProviderLoader({
		provider: 'openai',
		importPath: '@langchain/openai',
		clientName: 'ChatOpenAI',
		buildConfig: (model, apiKey) => ({
			modelName: model,
			openAIApiKey: apiKey,
			temperature: 0.3
		})
	}),
	anthropic: makeProviderLoader({
		provider: 'anthropic',
		importPath: '@langchain/anthropic',
		clientName: 'ChatAnthropic',
		buildConfig: (model, apiKey) => ({
			model,
			apiKey,
			temperature: 0.3
		})
	}),
	google: makeProviderLoader({
		provider: 'google',
		importPath: '@langchain/google-genai',
		clientName: 'ChatGoogleGenerativeAI',
		buildConfig: (model, apiKey) => ({
			modelName: model,
			apiKey,
			temperature: 0.3
		})
	}),
	ollama: async (model, type) => {
		if (type === 'image') {
			throw new Error('Ollama provider does not support image prompts in this flow')
		}
		const baseUrl = env.OLLAMA_BASE_URL || 'http://localhost:11434'
		const { ChatOllama } = await import('@langchain/ollama')
		return new ChatOllama({
			model,
			baseUrl,
			temperature: 0.3
		})
	}
}

async function loadChatClient(provider, model, type) {
	const loader = providerLoaders[provider]
	if (!loader) {
		throw new Error(
			`Unsupported provider: ${provider}. Install the appropriate LangChain provider package and add a loader in providerLoaders.`
		)
	}
	return loader(model, type)
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
	provider,
	content = '',
	type = 'html',
	url = '',
	imageBuffer,
	imageMimeType
}) {
	if (env.LLM_API_ENABLED !== 'true') throw new Error('LLM API is disabled')

	const defaultProvider = env.LLM_PROVIDER || 'openai'
	const textProvider = provider || env.LLM_TEXT_PROVIDER || defaultProvider
	const imageProvider =
		provider || env.LLM_IMAGE_PROVIDER || env.LLM_TEXT_PROVIDER || defaultProvider
	const textModel = env.LLM_TEXT_MODEL || env.LLM_API_ENGINE_TEXT || 'gpt-3.5-turbo'
	const imageModel = env.LLM_IMAGE_MODEL || env.LLM_API_ENGINE_IMAGE || 'gpt-4o'

	const effectiveProvider = type === 'image' ? imageProvider : textProvider
	const model = type === 'image' ? imageModel : textModel

	if (type === 'image' && effectiveProvider === 'ollama') {
		throw new Error('Ollama provider does not support image prompts')
	}

	const chat = await loadChatClient(effectiveProvider, model, type)

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
