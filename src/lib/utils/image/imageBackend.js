import sharp from 'sharp'
import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'

/**
 * Deletes a single photo file from the filesystem.
 * @param {string} id - The ID of the photo.
 * @param {string} fileType - The file type of the photo (e.g., 'jpg', 'png').
 */
export async function deleteSinglePhotoFile(id, fileType) {
	const photoPath = path.join('static/recipe_photos/', `${id}.${fileType}`)
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

async function downloadImage(url, photoFilename, directory) {
	console.log('Downloading Image!')
	const response = await fetch(url)
	const arrayBuffer = await response.arrayBuffer()
	const buffer = Buffer.from(arrayBuffer)
	await savePhoto(buffer, photoFilename, directory)
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
	const imagePath = `static/recipe_photos/`
	const imageFullPath = path.join(imagePath, filename)
	const tempImagePath = path.join(imagePath, `${uid}_temp.${fileExtension}`)

	await downloadImage(imageUrl, filename, imagePath)
	await resizeImage(imageFullPath, tempImagePath, 1024)

	// Replace the original image with the resized version
	await fsPromises.rename(tempImagePath, imageFullPath)
}

export async function savePhoto(photoData, photoFilename, directory) {
	const imagePath = path.join(directory, photoFilename)

	// Check if the photo already exists
	if (!fs.existsSync(imagePath)) {
		try {
			// Handle different input types
			if (photoData instanceof ArrayBuffer) {
				// Convert ArrayBuffer to Buffer
				photoData = Buffer.from(photoData)
			} else if (typeof photoData === 'string') {
				// Convert base64 string to Buffer
				photoData = Buffer.from(photoData, 'base64')
			}

			// Write the data to the file
			await fsPromises.writeFile(imagePath, photoData)
		} catch (error) {
			console.error('Error saving photo:', error)
			throw error // Rethrow the error to handle it at a higher level
		}
	}
}
