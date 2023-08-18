import { Open } from 'unzipper'
import path from 'path'
import fs from 'fs'

// Takes a .paprikarecipes file and returns a nested object of recipes
export async function extractRecipes(zipFilePath) {
	const recipes = []
	const cacheDir = path.join(path.dirname(zipFilePath), 'cache')

	// Ensure cache directory exists
	await fs.mkdir(cacheDir, { recursive: true })

	// Unzip the main .paprikarecipes file
	const directory = await Open.file(zipFilePath)

	for (const entry of directory.files) {
		if (entry.path.endsWith('.paprikarecipe')) {
			const recipeZipPath = path.join(cacheDir, entry.path)
			await entry.stream().pipe(fs.createWriteStream(recipeZipPath)).promise()

			const recipeZip = await Open.file(recipeZipPath)
			for (const recipeEntry of recipeZip.files) {
				if (!recipeEntry.path.includes('/')) {
					// Ensure it's a direct file, not in a sub-directory
					const recipeContent = await recipeEntry.buffer()
					const recipeJson = JSON.parse(recipeContent.toString('utf8'))
					recipes.push(recipeJson)
				}
			}

			// Remove the processed .paprikarecipe file
			await fs.unlink(recipeZipPath)
		}
	}

	// Optionally, remove the cache directory if it's empty
	await fs.rmdir(cacheDir).catch(() => {})

	return recipes
}
