import { prisma } from '$lib/server/prisma'

export async function PUT({ request, locals }) {
	const session = await locals.auth.validate()
	const user = session.user

	// Parse the request data
	const bodyText = await request.text()
	const photosToUpdate = JSON.parse(bodyText)

	// If the user is not authenticated
	if (!session || !user) {
		return new Response('User not authenticated', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		for (let photoData of photosToUpdate) {
			const photo = await prisma.recipePhoto.findUniqueOrThrow({
				where: {
					id: photoData.id
				}
			})

			const recipe = await prisma.recipe.findUniqueOrThrow({
				where: {
					uid: photo.recipeUid
				}
			})

			// Check if the authenticated user is the owner of the recipe
			if (!recipe || recipe.userId !== user.userId) {
				return new Response(`Unauthorized to update photo with id ${photoData.id}`, {
					status: 403,
					headers: {
						'Content-Type': 'application/json'
					}
				})
			}

			// Update the photo in the database
			await prisma.recipePhoto.update({
				where: { id: photoData.id },
				data: { isMain: photoData.isMain, notes: photoData.notes }
			})
		}

		return new Response(
			{ message: 'Photos updated successfully' },
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	} catch (error) {
		return new Response(
			{ error: `Failed to update photos: ${error.message}` },
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}
}
