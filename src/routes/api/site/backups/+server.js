import { copyFile, stat } from 'fs/promises'
import { join } from 'path'
import { getBackupInfo } from '$lib/server/backups'
import { requireAdmin, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function GET({ locals }) {
	requireAdmin(locals)

	try {
		const backupInfo = await getBackupInfo()
		return jsonSuccess(backupInfo)
	} catch (err) {
		return jsonError(500, {
			error: `Failed to read backup information: ${err.message}`,
			code: 'admin.site.msg.backupInfoLoadFail'
		})
	}
}

export async function POST({ locals }) {
	requireAdmin(locals)

	try {
		const dbPath = process.env.DATABASE_PATH || './prisma/db'
		const dbFile = join(dbPath, 'dev.sqlite')

		try {
			await stat(dbFile)
		} catch {
			return jsonError(404, {
				error: 'Database file not found',
				code: 'admin.site.msg.backupDbFileMissing'
			})
		}

		const timestamp = new Date()
			.toISOString()
			.replace(/[-:]/g, '')
			.replace('T', '-')
			.substring(0, 15)
		const backupFile = join(dbPath, `manual-${timestamp}.sqlite`)

		await copyFile(dbFile, backupFile)

		const stats = await stat(backupFile)
		const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)

		return jsonSuccess(
			{
				success: true,
				message: 'Manual backup created successfully',
				code: 'admin.site.msg.backupCreated',
				backup: {
					name: `manual-${timestamp}.sqlite`,
					size: `${sizeMB} MB`,
					sizeBytes: stats.size,
					timestamp: timestamp,
					type: 'manual'
				}
			},
			201
		)
	} catch (err) {
		return jsonError(500, {
			error: `Failed to create backup: ${err.message}`,
			code: 'admin.site.msg.backupFail'
		})
	}
}
