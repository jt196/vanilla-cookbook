import { prisma } from '$lib/server/prisma'
import fs from 'fs'
import sharp from 'sharp'

export async function createRecipePhotoEntry(recipeUid, imageUrl, fileType) {
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

async function downloadImage(url, path) {
	const response = await fetch(url)
	const blob = await response.blob()
	const reader = new FileReader()
	reader.readAsArrayBuffer(blob)
	reader.onloadend = () => {
		const buffer = Buffer.from(reader.result)
		fs.promises.writeFile(path, buffer)
	}
}

async function resizeImage(inputPath, outputPath, maxSize) {
	const image = sharp(inputPath)
	const metadata = await image.metadata()

	if (metadata.width > maxSize || metadata.height > maxSize) {
		await image.resize({ width: maxSize, height: maxSize, fit: 'inside' }).toFile(outputPath)
	} else {
		await image.toFile(outputPath)
	}
}

export async function processImage(imageUrl, uid, fileExtension) {
	const imagePath = `./images/${uid}${fileExtension}`
	await downloadImage(imageUrl, imagePath)
	await resizeImage(imagePath, imagePath, 1024)
}
