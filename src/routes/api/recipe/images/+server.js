import { prisma } from '$lib/server/prisma'
import { requireAuth, requireOwnership, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function PUT({ request, locals }) {
	const user = requireAuth(locals)

	const bodyText = await request.text()
	const photosToUpdate = JSON.parse(bodyText)

	try {
		for (let photoData of photosToUpdate) {
			const photo = await prisma.recipePhoto.findUniqueOrThrow({
				where: { id: photoData.id }
			})

			const recipe = await prisma.recipe.findUniqueOrThrow({
				where: { uid: photo.recipeUid }
			})

			requireOwnership(user, recipe)

			await prisma.recipePhoto.update({
				where: { id: photoData.id },
				data: { isMain: photoData.isMain, notes: photoData.notes }
			})
		}

		return jsonSuccess({ message: 'Photos updated successfully' })
	} catch (err) {
		if (err.status) throw err
		return jsonError(500, `Failed to update photos: ${err.message}`)
	}
}
