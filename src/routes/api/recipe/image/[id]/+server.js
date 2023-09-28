import { prisma } from '$lib/server/prisma'
import { deleteSinglePhotoFile } from '$lib/utils/image/imageBackend.js'
import fs from 'fs'
import path from 'path'

// Handle GET request to retrieve the image
export async function GET({ params }) {
	const { id } = params
	const photo = await prisma.recipePhoto.findUniqueOrThrow({
		where: {
			id
		}
	})

	if (!photo) {
		return new Response(JSON.stringify({ message: 'Image not found' }), {
			status: 404,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	const filePath = path.join(process.cwd(), 'uploads', `${photo.id}.${photo.fileType}`)

	if (fs.existsSync(filePath)) {
		const file = fs.readFileSync(filePath)
		return new Response(file, {
			headers: {
				'Content-Type': `image/${photo.fileType}`
			}
		})
	} else {
		return new Response(JSON.stringify({ message: 'File not found' }), {
			status: 404,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}

// Handle delete request
export async function DELETE({ params, locals }) {
	const { session, user } = await locals.auth.validateUser()
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
