import { prisma } from '$lib/server/prisma'
import { deleteSinglePhotoFile, resizeImageBuffer } from '$lib/utils/image/imageBackend.js'
import { validImageTypes } from '$lib/utils/import/importHelpers.js'
import { fileTypeFromBuffer } from 'file-type'
import fs from 'fs'
import path from 'path'
import axios from 'axios'

const REMOTE_IMAGE_TIMEOUT_MS = 10000

/**
 * Fetch a photo that only exists at its original URL, and keep a local copy so
 * later requests don't depend on the remote site.
 *
 * @param {{ id: string, url: string, fileType: string }} photo
 * @param {string} filePath - Where the local copy belongs
 * @returns {Promise<{ buffer: Buffer, mime: string } | null>} null if unavailable or not an image
 */
async function fetchAndCacheRemotePhoto(photo, filePath) {
	let host = photo.url
	try {
		host = new URL(photo.url).host
	} catch {
		// keep the raw value for the log
	}

	let buffer
	try {
		const response = await axios.get(photo.url, {
			responseType: 'arraybuffer',
			timeout: REMOTE_IMAGE_TIMEOUT_MS
		})
		buffer = Buffer.from(response.data)
	} catch (err) {
		const reason = err.response?.status ?? err.code ?? err.message
		console.warn(`Remote image unavailable for photo ${photo.id} (${host}): ${reason}`)
		return null
	}

	const detected = await fileTypeFromBuffer(buffer)
	if (!detected || !validImageTypes.includes(detected.ext)) {
		console.warn(`Remote image for photo ${photo.id} (${host}) is not a supported image`)
		return null
	}

	try {
		const resized = await resizeImageBuffer(buffer)
		await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
		await fs.promises.writeFile(filePath, resized)
		console.log(`Saved local copy of remote photo ${photo.id} (${host})`)
		return { buffer: resized, mime: detected.mime }
	} catch (err) {
		// Still serve the image even if caching it failed
		console.warn(`Could not save local copy of photo ${photo.id}: ${err.message}`)
		return { buffer, mime: detected.mime }
	}
}
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
		const remote = await fetchAndCacheRemotePhoto(photo, filePath)
		if (!remote) return new Response(null, { status: 204 })
		return new Response(remote.buffer, {
			status: 200,
			headers: { 'Content-Type': remote.mime }
		})
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

		return jsonSuccess({
			message: 'Photo deleted successfully',
			code: 'photos.msg.deleted',
			uid: id
		})
	} catch (err) {
		if (err.status) throw err
		return jsonError(500, {
			error: `Failed to delete photo: ${err.message}`,
			code: 'photos.msg.deleteFail'
		})
	}
}
