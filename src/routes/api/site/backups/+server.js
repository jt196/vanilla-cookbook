import { copyFile, stat } from 'fs/promises'
import { join } from 'path'
import { getBackupInfo } from '$lib/server/backups'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export const GET = async ({ locals }) => {
	const session = await locals.auth.validate()
	const user = session?.user

	if (!session || !user) {
		return new Response('User not authenticated!', { status: 401, headers: JSON_HEADERS })
	}

	if (!user.isAdmin) {
		return new Response('Unauthorised to view backup settings!', {
			status: 403,
			headers: JSON_HEADERS
		})
	}

	try {
		const backupInfo = await getBackupInfo()
		return new Response(JSON.stringify(backupInfo), { status: 200, headers: JSON_HEADERS })
	} catch (error) {
		return new Response(
			JSON.stringify({ error: `Failed to read backup information: ${error.message}` }),
			{
				status: 500,
				headers: JSON_HEADERS
			}
		)
	}
}

export const POST = async ({ locals }) => {
	const session = await locals.auth.validate()
	const user = session?.user

	if (!session || !user) {
		return new Response('User not authenticated!', { status: 401, headers: JSON_HEADERS })
	}

	if (!user.isAdmin) {
		return new Response('Unauthorised to create backups!', {
			status: 403,
			headers: JSON_HEADERS
		})
	}

	try {
		const dbPath = process.env.DATABASE_PATH || './prisma/db'
		const dbFile = join(dbPath, 'dev.sqlite')

		// Check if database exists
		try {
			await stat(dbFile)
		} catch (error) {
			return new Response(JSON.stringify({ error: 'Database file not found' }), {
				status: 404,
				headers: JSON_HEADERS
			})
		}

		// Create manual backup with timestamp
		const timestamp = new Date()
			.toISOString()
			.replace(/[-:]/g, '')
			.replace('T', '-')
			.substring(0, 15) // Format: YYYYMMDD-HHMMSS
		const backupFile = join(dbPath, `manual-${timestamp}.sqlite`)

		await copyFile(dbFile, backupFile)

		// Get file size
		const stats = await stat(backupFile)
		const sizeMB = (stats.size / (1024 * 1024)).toFixed(2)

		return new Response(
			JSON.stringify({
				success: true,
				message: 'Manual backup created successfully',
				backup: {
					name: `manual-${timestamp}.sqlite`,
					size: `${sizeMB} MB`,
					sizeBytes: stats.size,
					timestamp: timestamp,
					type: 'manual'
				}
			}),
			{ status: 201, headers: JSON_HEADERS }
		)
	} catch (error) {
		return new Response(JSON.stringify({ error: `Failed to create backup: ${error.message}` }), {
			status: 500,
			headers: JSON_HEADERS
		})
	}
}
