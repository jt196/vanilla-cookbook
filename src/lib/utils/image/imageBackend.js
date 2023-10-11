import sharp from 'sharp'
import { promises as fsPromises } from 'fs'
import path from 'path'
import { saveFile, validImageTypes } from '$lib/utils/import/files'
import { fileTypeFromBuffer } from 'file-type'

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

		await resizeImage(imageFullPath, tempImagePath, 1024)

		// Replace the original image with the resized version
		await fsPromises.rename(tempImagePath, imageFullPath)

		// Return true on successful processing
		return true
	} catch (error) {
		console.error('Error processing the image:', error)
		return false // Indicate failure
	}
}

// Helper function to download image as buffer
async function downloadImageAsBuffer(url) {
	const response = await fetch(url)
	const arrayBuffer = await response.arrayBuffer()
	return Buffer.from(arrayBuffer)
}
