import { saveFile } from '$lib/utils/import/files.js'
import { fileTypeFromBuffer } from 'file-type'

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
			const directory = 'uploads'
			const filename = `${user.userId}_recipes.paprikarecipes`

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
