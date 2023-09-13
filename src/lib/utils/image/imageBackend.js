import { prisma } from '$lib/server/prisma'
import sharp from 'sharp'
import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'

export async function createRecipePhotoEntry(recipeUid, imageUrl, fileType) {
	console.log('🚀 ~ file: imageBackend.js:6 ~ createRecipePhotoEntry ~ fileType:', fileType)
	console.log('🚀 ~ file: imageBackend.js:6 ~ createRecipePhotoEntry ~ imageUrl:', imageUrl)
	console.log('🚀 ~ file: imageBackend.js:6 ~ createRecipePhotoEntry ~ recipeUid:', recipeUid)
	return await prisma.recipePhoto.create({
		data: {
			recipeUid: recipeUid,
			url: imageUrl,
			fileType: fileType,
			isMain: true
		}
	})
}

export async function removeRecipePhotoEntry(uid) {
	await prisma.recipePhoto.delete({
		where: { id: uid }
	})
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
		let imageBuffer

		// Check if photoData is a base64 string or a Buffer
		if (typeof photoData === 'string') {
			imageBuffer = Buffer.from(photoData, 'base64')
		} else if (Buffer.isBuffer(photoData)) {
			imageBuffer = photoData
		} else {
			throw new Error('Invalid photo data provided.')
		}

		await fs.promises.writeFile(imagePath, imageBuffer)
	}
}
