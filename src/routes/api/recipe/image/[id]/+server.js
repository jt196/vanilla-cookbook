import { prisma } from '$lib/server/prisma'
import { deleteSinglePhotoFile } from '$lib/utils/image/imageBackend.js'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

// Handle GET request to retrieve the image
export async function GET({ params }) {
	const { id } = params
	const photo = await prisma.recipePhoto.findUnique({
		where: {
			id
		}
	})

	if (!photo) {
		// No photo found: return empty so the client can skip rendering an image
		return new Response(null, { status: 204 })
	}

	const filePath = path.join(process.cwd(), 'uploads/images', `${photo.id}.${photo.fileType}`)

	if (fs.existsSync(filePath)) {
		const file = fs.readFileSync(filePath)
		return new Response(file, {
			headers: {
				'Content-Type': `image/${photo.fileType}`
			}
		})
	} else if (photo.url) {
		try {
			const response = await axios.get(photo.url, {
				responseType: 'arraybuffer' // This is crucial to get the image as a buffer
			})

			const buffer = Buffer.from(response.data, 'binary')

			return new Response(buffer, {
				status: 200,
				headers: {
					'Content-Type': `image/${photo.fileType}`
				}
			})
		} catch (error) {
			console.error('Error fetching the image:', error)
			// Remote fetch failed: treat as missing so UI can hide the image gracefully
			return new Response(null, { status: 204 })
		}
	} else {
		return new Response(null, { status: 204 })
	}
}

// Handle delete request
export async function DELETE({ params, locals }) {
	const session = await locals.auth.validate()
	const user = session?.user
	const { id } = params

	if (!session || !user) {
		console.log('User Not Authenticated!')
		return new Response('User not authenticated', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	const photo = await prisma.recipePhoto.findUniqueOrThrow({
		where: {
			id
		}
	})

	const recipe = await prisma.recipe.findUniqueOrThrow({
		where: {
			uid: photo.recipeUid
		}
	})

	if (!recipe || recipe.userId !== user.userId) {
		return new Response('Unauthorized to delete this photo.', {
			status: 403,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
	try {
		const fileDeleted = deleteSinglePhotoFile(photo.id, photo.fileType)
		if (!fileDeleted) {
			console.log('Failed to delete the local file, but proceeding with database deletion.')
		}
		await prisma.recipePhoto.delete({
			where: { id }
		})
		return new Response(
			{ message: 'photo deleted successfully', uid: id },
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	} catch (error) {
		return new Response(
			{ error: `Failed to delete photo: ${error.message}` },
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}
}
