import { saveFile } from '$lib/utils/import/importHelpers'
import { importPaprikaRecipes } from '$lib/utils/import/paprika/paprikaFileImport.js'
import { fileTypeFromBuffer } from 'file-type'
import fs from 'fs'
import path from 'path'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function GET({ locals }) {
	const user = requireAuth(locals)

	try {
		const directory = 'uploads/imports'
		const files = fs.readdirSync(directory)

		const paprikaFiles = files
			.filter((file) => file.startsWith(user.userId) && path.extname(file) === '.paprikarecipes')
			.map((file) => file.replace(`${user.userId}_`, ''))

		return jsonSuccess({ files: paprikaFiles })
	} catch (err) {
		console.error('Error reading the directory', err)
		return jsonError(500, 'Failed to read the directory.')
	}
}

export async function PUT({ request, locals }) {
	const user = requireAuth(locals)

	const formData = await request.formData()
	const paprikaFile = formData.get('paprikaFile')

	if (!paprikaFile) {
		return jsonError(400, 'No file provided.')
	}

	try {
		const fileBuffer = await paprikaFile.arrayBuffer()
		const fileTypeResult = await fileTypeFromBuffer(fileBuffer)

		if (!fileTypeResult || fileTypeResult.ext !== 'zip') {
			return jsonError(400, 'Invalid file type.')
		}

		const directory = 'uploads/imports'
		const filename = `${user.userId}_${paprikaFile.name}`
		await saveFile(fileBuffer, filename, directory)

		return jsonSuccess({ success: 'File uploaded successfully!' })
	} catch (err) {
		console.error('Error processing file', err)
		return jsonError(500, 'Failed to save file.')
	}
}

export async function POST({ request, locals }) {
	const user = requireAuth(locals)

	try {
		const requestData = await request.json()
		const filename = `${user.userId}_${requestData.filename}`
		const isPublic = requestData.isPublic

		if (!requestData.filename) {
			return jsonError(400, 'Filename is required.')
		}

		const importedCount = await importPaprikaRecipes(user.userId, filename, isPublic)
		if (importedCount.count >= 0) {
			return jsonSuccess({
				success: importedCount.message,
				count: importedCount.count
			})
		} else {
			return jsonError(500, 'Failed to import paprika data.')
		}
	} catch (err) {
		console.error('Error processing the request', err)
		return jsonError(500, 'Failed to process the request.')
	}
}
