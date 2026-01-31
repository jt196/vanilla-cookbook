import path from 'path'
import fs from 'fs/promises'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function POST({ request, locals }) {
	const user = requireAuth(locals)

	const { filename } = await request.json()
	const filepath = path.join(process.cwd(), 'uploads/imports', user.userId + '_' + filename)
	try {
		await fs.access(filepath, fs.constants.F_OK)
		return jsonSuccess({ exists: true })
	} catch {
		return jsonSuccess({ exists: false })
	}
}

export async function DELETE({ request, locals }) {
	const user = requireAuth(locals)

	const { filename } = await request.json()
	const filepath = path.join(process.cwd(), 'uploads/imports', user.userId + '_' + filename)

	try {
		await fs.unlink(filepath)
		try {
			await fs.access(filepath, fs.constants.F_OK)
			return jsonError(500, 'File still exists after deletion.')
		} catch {
			return jsonSuccess({ success: true })
		}
	} catch (err) {
		console.error(`Error deleting the file ${filepath}:`, err)
		return jsonError(500, err.message)
	}
}
