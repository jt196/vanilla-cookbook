import { getBackupInfo } from '$lib/server/backups'

export const load = async ({ parent }) => {
	// Get parent data (settings, user)
	const parentData = await parent()

	try {
		const backupInfo = await getBackupInfo()
		return {
			...parentData,
			backupInfo
		}
	} catch (error) {
		console.error('Failed to load backup information:', error)
		return {
			...parentData,
			backupInfo: null,
			backupError: `Failed to load backup information: ${error.message}`
		}
	}
}
