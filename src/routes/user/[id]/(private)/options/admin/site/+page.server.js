import { getBackupInfo } from '$lib/server/backups'
import { env } from '$env/dynamic/private'

export const load = async ({ parent }) => {
	// Get parent data (settings, user)
	const parentData = await parent()

	const llmConfig = {
		enabled: env.LLM_API_ENABLED === 'true',
		textProvider: env.LLM_TEXT_PROVIDER || 'openai',
		textModel: env.LLM_TEXT_MODEL || env.LLM_API_ENGINE_TEXT || 'gpt-3.5-turbo',
		imageProvider: env.LLM_IMAGE_PROVIDER || env.LLM_TEXT_PROVIDER || 'openai',
		imageModel: env.LLM_IMAGE_MODEL || env.LLM_API_ENGINE_IMAGE || 'gpt-4o'
	}

	try {
		const backupInfo = await getBackupInfo()
		return {
			...parentData,
			backupInfo,
			llmConfig
		}
	} catch (error) {
		console.error('Failed to load backup information:', error)
		return {
			...parentData,
			backupInfo: null,
			backupError: `Failed to load backup information: ${error.message}`,
			llmConfig
		}
	}
}
