import { prisma } from '$lib/server/prisma'
import { deleteSinglePhotoFile } from '$lib/utils/image/imageBackend.js'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import { requireAuth, requireOwnership, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function GET({ params }) {
	const { id } = params
	const photo = await prisma.recipePhoto.findUnique({
		where: { id }
	})

	if (!photo) {
		return new Response(null, { status: 204 })
	}

	const filePath = path.join(process.cwd(), 'uploads/images', `${photo.id}.${photo.fileType}`)

	if (fs.existsSync(filePath)) {
		const file = fs.readFileSync(filePath)
		return new Response(file, {
			headers: { 'Content-Type': `image/${photo.fileType}` }
		})
	} else if (photo.url) {
		try {
			const response = await axios.get(photo.url, {
				responseType: 'arraybuffer'
			})

			const buffer = Buffer.from(response.data, 'binary')

			return new Response(buffer, {
				status: 200,
				headers: { 'Content-Type': `image/${photo.fileType}` }
			})
		} catch (err) {
			console.error('Error fetching the image:', err)
			return new Response(null, { status: 204 })
		}
	} else {
		return new Response(null, { status: 204 })
	}
}

export async function DELETE({ params, locals }) {
	const user = requireAuth(locals)
	const { id } = params

	try {
		const photo = await prisma.recipePhoto.findUniqueOrThrow({
			where: { id }
		})

		const recipe = await prisma.recipe.findUniqueOrThrow({
			where: { uid: photo.recipeUid }
		})

		requireOwnership(user, recipe)

		const fileDeleted = deleteSinglePhotoFile(photo.id, photo.fileType)
		if (!fileDeleted) {
			console.log('Failed to delete the local file, but proceeding with database deletion.')
		}

		await prisma.recipePhoto.delete({
			where: { id }
		})

		return jsonSuccess({ message: 'Photo deleted successfully', uid: id })
	} catch (err) {
		if (err.status) throw err
		return jsonError(500, `Failed to delete photo: ${err.message}`)
	}
}
