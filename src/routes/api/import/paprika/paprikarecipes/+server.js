import { saveFile } from '$lib/utils/import/files.js'
import { importPaprikaRecipes } from '$lib/utils/import/paprika/paprikaFileImport.js'
import { fileTypeFromBuffer } from 'file-type'
import fs from 'fs'
import path from 'path'

// Gets a list of .paprikarecipes files in the uploads/imports folder
export async function GET({ locals }) {
	const { session, user } = await locals.auth.validateUser()
	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		const directory = 'uploads/imports'

		// Read the directory
		const files = fs.readdirSync(directory)

		// Filter out filenames with the .paprikarecipes extension
		// Filter out filenames that start with userId and have the .paprikarecipes extension
		const paprikaFiles = files
			.filter((file) => file.startsWith(user.userId) && path.extname(file) === '.paprikarecipes')
			.map((file) => file.replace(`${user.userId}_`, ''))

		return new Response(JSON.stringify({ files: paprikaFiles }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		console.error('Error reading the directory', error)
		return new Response(JSON.stringify({ error: 'Failed to read the directory.' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}

// Uploads a .paprikarecipes zip file to the uploads/import folder
export async function PUT({ request, locals }) {
	const { session, user } = await locals.auth.validateUser()
	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	const formData = await request.formData()
	const paprikaFile = formData.get('paprikaFile')

	if (paprikaFile) {
		try {
			const fileBuffer = await paprikaFile.arrayBuffer()
			const fileTypeResult = await fileTypeFromBuffer(fileBuffer)

			// Ensure that the file type is 'zip'
			if (!fileTypeResult || fileTypeResult.ext !== 'zip') {
				return new Response(JSON.stringify({ error: 'Invalid file type.' }), {
					status: 400,
					headers: {
						'Content-Type': 'application/json'
					}
				})
			}

			// Specify the directory where you want to save the file
			const directory = 'uploads/imports'
			// Change the filename to userId_recipes.paprikarecipes
			// const filename = `${user.userId}_recipes.paprikarecipes`
			// Use the original filename
			const filename = `${user.userId}_${paprikaFile.name}`

			// Save the paprika file
			await saveFile(fileBuffer, filename, directory)

			return new Response(JSON.stringify({ success: 'File uploaded successfully!' }), {
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		} catch (error) {
			console.error('Error processing file', error)
			return new Response(JSON.stringify({ error: 'Failed to save file.' }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}
	}

	// If no file was provided, you might want to handle this case too.
	return new Response(JSON.stringify({ error: 'No file provided.' }), {
		status: 400,
		headers: {
			'Content-Type': 'application/json'
		}
	})
}

export async function POST({ request, locals }) {
	const { session, user } = await locals.auth.validateUser()
	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		const requestData = await request.json()
		const filename = `${user.userId}_${requestData.filename}`
		console.log('🚀 ~ file: +server.js:122 ~ POST ~ filename:', filename)

		if (!filename) {
			return new Response(JSON.stringify({ error: 'Filename is required.' }), {
				status: 400,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		// Importing the paprika file
		const importedCount = await importPaprikaRecipes(user.userId, filename)
		console.log('🚀 ~ file: +server.js:141 ~ POST ~ importedCount:', importedCount)

		if (importedCount.count >= 0) {
			return new Response(
				JSON.stringify({
					success: importedCount.message,
					count: importedCount.count
				}),
				{
					status: 200,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)
		} else {
			// Handle errors from the importPaprikaData function, if any
			return new Response(JSON.stringify({ error: 'Failed to import paprika data.' }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}
	} catch (error) {
		console.error('Error processing the request', error)
		return new Response(JSON.stringify({ error: 'Failed to process the request.' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
