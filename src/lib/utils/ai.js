import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { env } from '$env/dynamic/private'

/**
 * Map of measurement system codes to human-readable descriptions for AI prompts
 */
const unitsMap = {
	metric: 'metric (grams, milliliters, celsius)',
	americanVolumetric: 'US volumetric (cups, teaspoons, tablespoons, fahrenheit)',
	imperial: 'imperial (ounces, pounds, pints, fahrenheit)'
}

/**
 * Map of language codes to full language names for AI prompts
 * Matches the i18n language codes from recipe-ingredient-parser
 */
const languageMap = {
	eng: 'English',
	deu: 'German',
	ita: 'Italian',
	esp: 'Spanish',
	fra: 'French',
	por: 'Portuguese',
	rus: 'Russian',
	hin: 'Hindi',
	ind: 'Indonesian',
	ara: 'Arabic'
}

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
 * 9. Format ingredients with specific rules for consistency.
 *
 * @param {string} [inputLabel='Text'] - The label for the content.
 * @param {string} [content=''] - The content to extract from.
 * @param {string} [url=''] - A URL to include in the prompt.
 * @param {string} [language='eng'] - Language code for output (eng, deu, ita, etc.)
 * @returns {string} The generated prompt.
 */
function buildRecipePrompt(inputLabel = 'Text', content = '', url = '', language = 'eng') {
	const blockType = inputLabel
	const urlLine = inputLabel.toLowerCase() === 'html' && url ? `\nURL: ${url}` : ''
	const trimmedContent = content?.substring(0, 40000) || ''
	const languageName = languageMap[language] || 'English'

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
9. Format ingredients following these rules:
   - Use decimal numbers (1.5 kg) instead of fractions (1 1/2 kg)
   - Avoid prepositions like "of" (write "1.5 kg flour" not "1.5 kg of flour")
   - Place extra preparation information after a comma (e.g., "1.5 kg flour, sifted")
   - Avoid using "or" for alternative ingredients (pick one ingredient instead of "1.5 kg strong flour or all-purpose flour")
10. If the content language is ${languageName}, preserve ingredient and instruction text in that language.

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
 * Builds a prompt for recipe generation from user description.
 *
 * @param {string} [userPrompt=''] - User's recipe request/description
 * @param {string} [preferredUnits='metric'] - Preferred measurement system
 * @param {string} [language='eng'] - Language code for output (eng, deu, ita, etc.)
 * @returns {string} The generated prompt
 */
function buildRecipeFromPrompt(userPrompt = '', preferredUnits = 'metric', language = 'eng') {
	const trimmedPrompt = userPrompt?.substring(0, 4000) || ''
	const unitsDescription = unitsMap[preferredUnits] || unitsMap.metric
	const languageName = languageMap[language] || 'English'

	return `
You are a recipe creation AI. Using the user prompt below, create a complete, plausible recipe and return it as JSON.

Rules:
- Respond with JSON only, no Markdown fences or commentary.
- Populate all standard recipe fields. If something is unspecified, leave it empty or use reasonable defaults.
- Ingredients: array of strings, one ingredient per entry.
- Instructions: array of strings, one step per entry.
- Provide reasonable estimates for prepTime, cookTime, totalTime (in ISO 8601 duration format, e.g., "PT30M" for 30 minutes, "PT1H30M" for 1.5 hours).
- Provide a reasonable servings count (e.g., "4", "6-8", "12 cookies").
- Do not fabricate nutrition unless explicitly provided; leave blank if unknown.
- Use ${unitsDescription} for all quantities.
- Generate the recipe in ${languageName}.

Ingredient formatting rules (IMPORTANT):
- Use decimal numbers (1.5 kg) instead of fractions (1 1/2 kg)
- Avoid prepositions like "of" (write "1.5 kg flour" not "1.5 kg of flour")
- Place extra preparation information after a comma (e.g., "1.5 kg flour, sifted")
- Avoid using "or" for alternative ingredients (pick one ingredient instead of "1.5 kg strong flour or all-purpose flour")

JSON shape:
{
  "name": "",
  "author": "",
  "sourceUrl": "",
  "imageUrl": "",
  "description": "",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": ["Step 1", "Step 2"],
  "cookTime": "PT30M",
  "prepTime": "PT15M",
  "totalTime": "PT45M",
  "servings": "4",
  "nutrition": {}
}

User prompt:
"""${trimmedPrompt}"""
`
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
		const mod = await import(/* @vite-ignore */ importPath)
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
 * Core LLM invocation function - builds messages and calls the model
 * @private
 */
async function invokeLLM({ provider, model, type, messages }) {
	if (env.LLM_API_ENABLED !== 'true') throw new Error('LLM API is disabled')

	const defaultProvider = env.LLM_PROVIDER || 'openai'
	const effectiveProvider = provider || (type === 'image' ?
		(env.LLM_IMAGE_PROVIDER || env.LLM_TEXT_PROVIDER || defaultProvider) :
		(env.LLM_TEXT_PROVIDER || defaultProvider))

	const defaultTextModel = env.LLM_TEXT_MODEL || env.LLM_API_ENGINE_TEXT || 'gpt-3.5-turbo'
	const defaultImageModel = env.LLM_IMAGE_MODEL || env.LLM_API_ENGINE_IMAGE || 'gpt-4o'
	const effectiveModel = model || (type === 'image' ? defaultImageModel : defaultTextModel)

	if (type === 'image' && effectiveProvider === 'ollama') {
		throw new Error('Ollama provider does not support image prompts')
	}

	const chat = await loadChatClient(effectiveProvider, effectiveModel, type)

	try {
		const result = await chat.invoke(messages)
		let output = result.content.trim()

		// Clean up markdown code fences
		if (output.startsWith('```')) {
			output = output.replace(/```json\s*|\s*```/g, '')
		}
		// Remove trailing commas
		output = output.replace(/,\s*([\]}])/g, '$1')

		return JSON.parse(output)
	} catch (err) {
		console.error('LLM invocation failed:', err)
		throw new Error('LLM parsing error')
	}
}

/**
 * Extract a recipe from HTML, text, or image content using an LLM
 *
 * @param {Object} options
 * @param {string} [options.provider] - LLM provider (openai, anthropic, etc.)
 * @param {string} [options.model] - Specific model to use
 * @param {string} [options.content=''] - Text/HTML content to extract from
 * @param {string} [options.type='html'] - Content type: 'html', 'text', or 'image'
 * @param {string} [options.url=''] - Source URL (for HTML extraction)
 * @param {Buffer} [options.imageBuffer] - Image data (for image extraction)
 * @param {string} [options.imageMimeType] - Image MIME type
 * @param {string} [options.language='eng'] - Language code for output
 * @returns {Promise<Object>} Parsed recipe object
 */
export async function extractRecipeWithLLM({
	provider,
	model,
	content = '',
	type = 'html',
	url = '',
	imageBuffer,
	imageMimeType,
	language = 'eng'
}) {
	const messages = [new SystemMessage('You are an expert recipe extraction AI.')]

	if (type === 'image') {
		if (!imageBuffer || !imageMimeType) {
			throw new Error('Missing image data')
		}

		const imageDataURI = bufferToBase64ImageDataURI(imageBuffer, imageMimeType)
		const prompt = buildRecipePrompt('Image', '', '', language)

		messages.push(
			new HumanMessage({
				content: [
					{ type: 'text', text: prompt },
					{ type: 'image_url', image_url: { url: imageDataURI } }
				]
			})
		)
	} else {
		const trimmedContent = content.substring(0, 40000)
		const blockType = type === 'html' ? 'HTML' : 'Text'
		const prompt = buildRecipePrompt(blockType, trimmedContent, url, language)

		messages.push(new HumanMessage(prompt))
	}

	return invokeLLM({ provider, model, type, messages })
}

/**
 * Generate a recipe from a user prompt/description using an LLM
 *
 * @param {Object} options
 * @param {string} options.prompt - User's recipe description/request
 * @param {string} [options.provider] - LLM provider (openai, anthropic, etc.)
 * @param {string} [options.model] - Specific model to use
 * @param {string} [options.unitsPreference='metric'] - Preferred measurement system
 * @param {string} [options.language='eng'] - Language code for output
 * @returns {Promise<Object>} Generated recipe object
 */
export async function generateRecipeWithLLM({
	prompt: userPrompt,
	provider,
	model,
	unitsPreference = 'metric',
	language = 'eng'
}) {
	const messages = [
		new SystemMessage('You are an expert recipe creation AI.'),
		new HumanMessage(buildRecipeFromPrompt(userPrompt, unitsPreference, language))
	]

	return invokeLLM({ provider, model, type: 'text', messages })
}
