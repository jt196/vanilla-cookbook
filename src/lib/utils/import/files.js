import fs from 'fs'
import { promises as fsPromises } from 'fs'
import path from 'path'
import { fileTypeFromStream } from 'file-type'

/**
 * Validates the file type of a given stream against desired extensions.
 * Check for multiple types: isValidFileType(file, ['zip', 'gzip'])
 * Check for a single type: isValidFileType(file, 'zip')
 *
 * @param {ReadableStream} stream - The stream of the file to be checked.
 * @param {string|string[]} desiredExtensions - The extension(s) to validate against.
 * @returns {Promise<boolean>} A promise that resolves to true if the file type matches
 * any of the desired extensions, false otherwise.
 */
export async function isValidFileType(stream, desiredExtensions) {
	const fileTypeResult = await fileTypeFromStream(stream)

	if (!fileTypeResult) {
		return false
	}

	if (Array.isArray(desiredExtensions)) {
		return desiredExtensions.includes(fileTypeResult.ext)
	}

	return fileTypeResult.ext === desiredExtensions
}

export const validImageTypes = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']

/**
 * Saves a given file data to a specified filename in a given directory.
 * If the file already exists, this function will not overwrite it.
 * @param {ArrayBuffer|string} fileData - The data of the file to be saved.
 * @param {string} filename - The name of the file to be saved.
 * @param {string} directory - The directory in which to save the file.
 * @throws {Error} If there is an error while saving the file.
 */
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

/**
 * Checks if the given recipes data structure is valid.
 * This function checks if the given data is an array of objects,
 * and if the first object in the array has the required fields.
 * The required fields are:
 * - name: a string
 * @param {Array} recipes - The recipes data structure to be validated.
 * @return {boolean} true if the structure is valid, false otherwise.
 */
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
