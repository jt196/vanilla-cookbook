import { readdir, stat } from 'fs/promises'
import { join } from 'path'
import { cronToPlainEnglish } from '$lib/utils/dateTime'

/**
 * Get backup information including list of backups, schedule, and retention settings
 * @returns {Promise<{backups: Array, cronPlainEnglish: string, retentionCount: number}>}
 */
export async function getBackupInfo() {
	// Get backup configuration from environment
	const cronSchedule = process.env.BACKUP_CRON_SCHEDULE || '0 3 * * 0'
	const retentionCount = parseInt(process.env.BACKUP_RETENTION_COUNT || '6', 10)
	const cronPlainEnglish = cronToPlainEnglish(cronSchedule)

	// Read backup files from database directory
	const dbPath = process.env.DATABASE_PATH || './prisma/db'
	const files = await readdir(dbPath)

	// Filter for backup files and get their info
	const backupFiles = await Promise.all(
		files
			.filter((file) => file.endsWith('.sqlite') && file !== 'dev.sqlite')
			.map(async (file) => {
				const filePath = join(dbPath, file)
				const stats = await stat(filePath)

				// Parse timestamp from filename
				// Format: migration-YYYYMMDD-HHMMSS.sqlite or scheduled-backup-YYYYMMDD-HHMMSS.sqlite
				const match = file.match(/(\d{8})-(\d{6})/)
				let timestamp = stats.mtime // Fallback to file modification time

				if (match) {
					const dateStr = match[1] // YYYYMMDD
					const timeStr = match[2] // HHMMSS
					const year = dateStr.substring(0, 4)
					const month = dateStr.substring(4, 6)
					const day = dateStr.substring(6, 8)
					const hour = timeStr.substring(0, 2)
					const minute = timeStr.substring(2, 4)
					const second = timeStr.substring(4, 6)
					timestamp = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`)
				}

				// Determine backup type
				let type = 'scheduled'
				if (file.startsWith('migration-')) {
					type = 'pre-migration'
				} else if (file.startsWith('manual-')) {
					type = 'manual'
				}

				// Format size in MB
				const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)

				return {
					name: file,
					size: `${sizeMB} MB`,
					sizeBytes: stats.size,
					timestamp: timestamp.toISOString(),
					type
				}
			})
	)

	// Sort by timestamp, newest first
	backupFiles.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

	return {
		backups: backupFiles,
		cronPlainEnglish,
		retentionCount
	}
}
