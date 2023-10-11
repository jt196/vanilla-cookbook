import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'
import FileType from 'file-type'

// Check for a single type: isValidFileType(file, 'zip')
// Check for multiple types: isValidFileType(file, ['zip', 'gzip'])
export async function isValidFileType(stream, desiredExtensions) {
	const fileTypeResult = await FileType.fromStream(stream)

	if (!fileTypeResult) {
		return false
	}

	if (Array.isArray(desiredExtensions)) {
		return desiredExtensions.includes(fileTypeResult.ext)
	}

	return fileTypeResult.ext === desiredExtensions
}

export const validImageTypes = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']

export async function saveFile(fileData, filename, directory) {
	const filePath = path.join(directory, filename)

	// Check if the file already exists
	if (!fs.existsSync(filePath)) {
		try {
			// Handle different input types
			if (fileData instanceof ArrayBuffer) {
				// Convert ArrayBuffer to Buffer
				fileData = Buffer.from(fileData)
			} else if (typeof fileData === 'string') {
				// Convert base64 string to Buffer
				fileData = Buffer.from(fileData, 'base64')
			}

			// Write the data to the file
			await fsPromises.writeFile(filePath, fileData)
		} catch (error) {
			console.error('Error saving file:', error)
			throw error // Rethrow the error to handle it at a higher level
		}
	}
}

export function isValidRecipeStructure(recipes) {
	// We're expecting an array of recipes
	if (!Array.isArray(recipes) || recipes.length === 0) return false

	const firstRecipe = recipes[0]

	// Define required fields and their types
	const requiredFields = {
		name: 'string'
	}

	for (let field in requiredFields) {
		if (typeof firstRecipe[field] !== requiredFields[field]) {
			return false
		}
	}

	return true
}
