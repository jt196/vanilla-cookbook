import sharp from 'sharp'
import fs, { promises as fsPromises } from 'fs'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileTypeFromBuffer } from 'file-type'
import { saveFile, validImageTypes } from '$lib/utils/import/importHelpers'
import { RECIPE_IMAGE_MAX_DIMENSION } from '$lib/utils/image/imageConfig'
import { prisma } from '$lib/server/prisma'

/** Absolute path of a stored photo file. */
export function photoFilePath(photoId, fileType) {
	return path.join(process.cwd(), 'uploads/images', `${photoId}.${fileType}`)
}

/** @param {string} url */
function hostOf(url) {
	try {
		return new URL(url).host
	} catch {
		return url
	}
}

/**
 * Download a remote image and check it really is a supported image.
 * Failures (HTTP errors, timeouts, non-image content) are logged on one line.
 *
 * @param {string} url
 * @returns {Promise<{ buffer: Buffer, ext: string } | null>} resized image and its detected extension
 */
export async function downloadRemoteImage(url) {
	try {
		const buffer = await downloadImageAsBuffer(url)
		const detected = await fileTypeFromBuffer(buffer)
		if (!detected || !validImageTypes.includes(detected.ext)) {
			console.warn(`Image at ${hostOf(url)} is not a supported image`)
			return null
		}
		return { buffer: await resizeImageBuffer(buffer), ext: detected.ext }
	} catch (err) {
		console.warn(`Could not download image from ${hostOf(url)}: ${err.message}`)
		return null
	}
}

/**
 * Write a photo's image data to uploads/images/{id}.{ext}.
 *
 * @param {string} photoId
 * @param {string} ext
 * @param {Buffer} buffer
 */
export async function writePhotoFile(photoId, ext, buffer) {
	const filePath = photoFilePath(photoId, ext)
	await fsPromises.mkdir(path.dirname(filePath), { recursive: true })
	await fsPromises.writeFile(filePath, buffer)
}

/**
 * Download an image URL and attach it to a recipe as a stored photo.
 * The photo row is only created once the image has downloaded and validated, so a
 * failed download never leaves a link-only photo behind. The source URL is kept on the row.
 *
 * @param {{ recipeUid: string, url: string, isMain?: boolean }} options
 * @returns {Promise<object | null>} the created photo, or null if the image couldn't be saved
 */
export async function saveRemoteImageAsPhoto({ recipeUid, url, isMain = false }) {
	const image = await downloadRemoteImage(url)
	if (!image) return null

	const photo = await prisma.recipePhoto.create({
		data: { recipeUid, url, fileType: image.ext, isMain }
	})
	try {
		await writePhotoFile(photo.id, image.ext, image.buffer)
		return photo
	} catch (err) {
		console.warn(`Could not save image for recipe ${recipeUid}: ${err.message}`)
		await prisma.recipePhoto.delete({ where: { id: photo.id } })
		return null
	}
}

/**
 * Deletes a single photo file from the filesystem.
 * @param {string} id - The ID of the photo.
 * @param {string} fileType - The file type of the photo (e.g., 'jpg', 'png').
 */
export async function deleteSinglePhotoFile(id, fileType) {
	const photoPath = path.join('uploads/images/', `${id}.${fileType}`)
	try {
		await fsPromises.unlink(photoPath)
		return true // Successfully deleted
	} catch (err) {
		if (err.code === 'ENOENT') {
			console.log(`Can't find local image at path: ${photoPath}, no action taken.`)
		} else {
			console.error(`Failed to delete photo at ${photoPath}`, err)
		}
		return false // Failed to delete
	}
}

/**
 * Downloads an image from a given URL and saves it to the file system.
 *
 * @param {string} url - The URL of the image to download.
 * @param {string} photoFilename - The filename of the downloaded image.
 * @param {string} directory - The directory to save the downloaded image in.
 * @throws {Error} If the image type is not supported.
 * @returns {Promise<void>} A promise that resolves when the image has been downloaded and saved.
 */
// eslint-disable-next-line no-unused-vars
async function downloadImage(url, photoFilename, directory) {
	console.log('Downloading Image!')
	const response = await fetch(url)
	const arrayBuffer = await response.arrayBuffer()
	const buffer = Buffer.from(arrayBuffer)

	// Validate the file type of the image
	const fileTypeResult = await fileTypeFromBuffer(buffer)

	if (!fileTypeResult || !validImageTypes.includes(fileTypeResult.ext)) {
		throw new Error('Invalid image type.')
	}

	await saveFile(buffer, photoFilename, directory)
}

/**
 * Resizes an image to fit within a given maximum size.
 * @param {string} inputPath - The path to the image to be resized.
 * @param {string} outputPath - The path to write the resized image to.
 * @param {number} maxSize - The maximum width and height of the resized image.
 * @returns {Promise<void>} A promise that resolves when the image has been resized and saved.
 */
async function resizeImage(inputPath, outputPath, maxSize) {
	console.log('Resizing Image!')
	const image = sharp(inputPath)
	const metadata = await image.metadata()

	if (metadata.width > maxSize || metadata.height > maxSize) {
		await image.resize({ width: maxSize, height: maxSize, fit: 'inside' }).toFile(outputPath)
	} else {
		// If no resizing is needed, simply copy the file
		await fsPromises.copyFile(inputPath, outputPath)
	}
}

/**
 * Downloads an image, validates its type, saves it to a file, resizes it,
 * and saves the resized version back to the same file.
 *
 * @param {string} imageUrl - The URL of the image to be downloaded.
 * @param {string} uid - The unique identifier for the image.
 * @param {string} fileExtension - The extension of the image file.
 * @returns {Promise<boolean>} A promise that resolves to a boolean indicating
 * if the image was successfully processed and saved.
 */
export async function processImage(imageUrl, uid, fileExtension) {
	const filename = `${uid}.${fileExtension}`
	const imagePath = `uploads/images/`
	const imageFullPath = path.join(imagePath, filename)
	const tempImagePath = path.join(imagePath, `${uid}_temp.${fileExtension}`)

	try {
		// 1. Download the image and keep it as a buffer
		const buffer = await downloadImageAsBuffer(imageUrl)

		// 2. Validate the buffer
		const fileTypeResult = await fileTypeFromBuffer(buffer)
		if (!fileTypeResult || !validImageTypes.includes(fileTypeResult.ext)) {
			console.error('Invalid image type.')
			return false // Indicate failure
		}

		// 3. Save buffer to file
		await saveFile(buffer, filename, imagePath)

		await resizeImage(imageFullPath, tempImagePath, RECIPE_IMAGE_MAX_DIMENSION)

		// Replace the original image with the resized version
		await fsPromises.rename(tempImagePath, imageFullPath)

		// Return true on successful processing
		return true
	} catch (error) {
		console.error('Error processing the image:', error)
		return false // Indicate failure
	}
}

/**
 * Downloads an image from a given URL and returns it as a buffer.
 *
 * @param {string} url - The URL of the image to download.
 * @returns {Promise<Buffer>} A promise that resolves with the downloaded image as a buffer.
 */
async function downloadImageAsBuffer(url) {
	if (url.startsWith('file://')) {
		// Strip the file:// prefix and read the file from disk.
		const filePath = url.slice(7)
		return await readFile(filePath)
	} else {
		const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
		if (!response.ok) {
			throw new Error(`Image download failed: HTTP ${response.status}`)
		}
		const arrayBuffer = await response.arrayBuffer()
		return Buffer.from(arrayBuffer)
	}
}

/**
 * Resize a buffer-based image to a max size.
 * Returns a new buffer (e.g. for uploading or embedding).
 *
 * @param {Buffer} buffer - Original image buffer
 * @param {number} maxSize - Max width or height (e.g. 1024)
 * @returns {Promise<Buffer>} Resized image buffer
 */
export async function resizeImageBuffer(buffer, maxSize = RECIPE_IMAGE_MAX_DIMENSION) {
	const image = sharp(buffer)
	const metadata = await image.metadata()

	if (metadata.width > maxSize || metadata.height > maxSize) {
		return await image.resize({ width: maxSize, height: maxSize, fit: 'inside' }).toBuffer()
	}

	// No resize needed
	return buffer
}

/**
 * Stitches multiple image buffers vertically into a single image.
 *
 * @param {Buffer[]} buffers - Array of image buffers
 * @param {Object} [options]
 * @param {number} [options.padding=12] - Padding between images
 * @param {string} [options.background='#ffffff'] - Background color
 * @param {number} [options.maxWidth=1200] - Max width to normalize images to
 * @returns {Promise<Buffer>} Combined image buffer (PNG)
 */
export async function stitchImages(
	buffers,
	{ padding = 12, background = '#ffffff', maxWidth = 1200 } = {}
) {
	if (!Array.isArray(buffers) || buffers.length === 0) {
		throw new Error('No images provided to stitch')
	}

	// Normalize widths
	const normalized = []
	for (const buf of buffers) {
		const img = sharp(buf)
		const meta = await img.metadata()
		const targetWidth = Math.min(maxWidth, meta.width || maxWidth)
		const resized = await img
			.resize({ width: targetWidth, fit: 'inside', withoutEnlargement: true })
			.toBuffer()
		const resizedMeta = await sharp(resized).metadata()
		normalized.push({
			buffer: resized,
			width: resizedMeta.width || targetWidth,
			height: resizedMeta.height || 0
		})
	}

	const width = Math.max(...normalized.map((n) => n.width))
	const height =
		normalized.reduce((acc, n) => acc + n.height, 0) + padding * Math.max(0, normalized.length - 1)

	const composite = []
	let currentTop = 0
	for (const n of normalized) {
		composite.push({
			input: n.buffer,
			top: currentTop,
			left: Math.floor((width - n.width) / 2)
		})
		currentTop += n.height + padding
	}

	const stitched = sharp({
		create: {
			width,
			height,
			channels: 4,
			background
		}
	})
		.composite(composite)
		.png()

	return await stitched.toBuffer()
}

/**
 * Photos on a user's recipes that only exist as a remote link (no local file).
 *
 * @param {string} userId
 * @returns {Promise<Array<{ id: string, url: string, fileType: string | null, recipe: { name: string | null } }>>}
 */
export async function findLinkOnlyPhotos(userId) {
	const photos = await prisma.recipePhoto.findMany({
		where: { url: { not: null }, recipe: { userId } },
		select: { id: true, url: true, fileType: true, recipe: { select: { name: true } } }
	})
	return photos.filter(
		(photo) => !photo.fileType || !fs.existsSync(photoFilePath(photo.id, photo.fileType))
	)
}

/**
 * Download every link-only photo on a user's recipes and store it locally.
 * Photos keep their id; the stored file type is corrected to the real image type.
 *
 * @param {string} userId
 * @returns {Promise<{ downloaded: number, failed: string[] }>} failed = recipe names whose photo couldn't be downloaded
 */
export async function downloadLinkOnlyPhotos(userId) {
	const photos = await findLinkOnlyPhotos(userId)
	let downloaded = 0
	const failed = []
	for (const photo of photos) {
		const image = await downloadRemoteImage(photo.url)
		if (!image) {
			failed.push(photo.recipe?.name || photo.id)
			continue
		}
		await writePhotoFile(photo.id, image.ext, image.buffer)
		if (image.ext !== photo.fileType) {
			await prisma.recipePhoto.update({ where: { id: photo.id }, data: { fileType: image.ext } })
		}
		downloaded++
	}
	return { downloaded, failed }
}
