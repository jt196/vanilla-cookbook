import { HumanMessage, SystemMessage } from '@langchain/core/messages'
import { buildRecipeExtractionPrompt, parseRecipeJsonOutput } from '$lib/utils/aiShared'
import { getDefaultModelsForProvider } from '$lib/utils/llmModels'

export function parseCompatibilityLLMJsonOutput(rawOutput) {
	return parseRecipeJsonOutput(rawOutput)
}

function resolveCompatibilityProvider(provider, env = process.env) {
	if (provider) return provider
	return (
		env.LLM_TEXT_PROVIDER ||
		env.LLM_PROVIDER ||
		(env.OPENAI_API_KEY
			? 'openai'
			: env.ANTHROPIC_API_KEY
				? 'anthropic'
				: env.GOOGLE_API_KEY
					? 'google'
					: env.OLLAMA_BASE_URL
						? 'ollama'
						: null)
	)
}

function resolveCompatibilityModel(provider, model, env = process.env) {
	if (model) return model
	return (
		env.LLM_TEXT_MODEL ||
		env.LLM_API_ENGINE_TEXT ||
		getDefaultModelsForProvider(provider)?.text ||
		getDefaultModelsForProvider('openai')?.text ||
		'gpt-4o-mini'
	)
}

async function loadChatClient(provider, model, env = process.env) {
	if (provider === 'openai') {
		if (!env.OPENAI_API_KEY) throw new Error('Missing openai API key')
		const { ChatOpenAI } = await import('@langchain/openai')
		return new ChatOpenAI({ model, apiKey: env.OPENAI_API_KEY, temperature: 0.3 })
	}

	if (provider === 'anthropic') {
		if (!env.ANTHROPIC_API_KEY) throw new Error('Missing anthropic API key')
		const { ChatAnthropic } = await import('@langchain/anthropic')
		return new ChatAnthropic({ model, apiKey: env.ANTHROPIC_API_KEY, temperature: 0.3 })
	}

	if (provider === 'google') {
		if (!env.GOOGLE_API_KEY) throw new Error('Missing google API key')
		const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai')
		return new ChatGoogleGenerativeAI({ model, apiKey: env.GOOGLE_API_KEY, temperature: 0.3 })
	}

	if (provider === 'ollama') {
		const { ChatOllama } = await import('@langchain/ollama')
		return new ChatOllama({
			model,
			baseUrl: env.OLLAMA_BASE_URL || 'http://localhost:11434',
			temperature: 0.3
		})
	}

	throw new Error(`Unsupported provider: ${provider}`)
}

export async function extractRecipeWithCompatibilityLLM({
	provider,
	model,
	content = '',
	url = '',
	env = process.env
}) {
	const effectiveProvider = resolveCompatibilityProvider(provider, env)
	if (!effectiveProvider) {
		throw new Error('No configured LLM provider available for compatibility fallback')
	}

	const effectiveModel = resolveCompatibilityModel(effectiveProvider, model, env)
	const chat = await loadChatClient(effectiveProvider, effectiveModel, env)
	const messages = [
		new SystemMessage('You are an expert recipe extraction AI.'),
		new HumanMessage(buildRecipeExtractionPrompt({ inputLabel: 'HTML', content, url }))
	]
	const result = await chat.invoke(messages)
	const output = result?.content?.toString?.() || ''
	return parseCompatibilityLLMJsonOutput(output)
}
