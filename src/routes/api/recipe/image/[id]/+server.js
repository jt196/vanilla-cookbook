import { prisma } from '$lib/server/prisma'
import { deleteSinglePhotoFile } from '$lib/utils/image/imageBackend.js'

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
