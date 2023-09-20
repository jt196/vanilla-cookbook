import { prisma } from '$lib/server/prisma'

export async function createRecipePhotoEntry(recipeUid, imageUrl, fileType, isMain = false) {
	return await prisma.recipePhoto.create({
		data: {
			recipeUid: recipeUid,
			url: imageUrl,
			fileType: fileType,
			isMain: isMain
		}
	})
}

export async function removeRecipePhotoEntry(uid) {
	await prisma.recipePhoto.delete({
		where: { id: uid }
	})
}
