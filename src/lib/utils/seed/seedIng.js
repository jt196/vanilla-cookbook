// Using relative import as this will run before app startup
import { ingVersion } from '../config.js'
import { clearIngredientCache } from '../converterBackend.js'
import fs from 'fs'
import csv from 'csv-parser'
import path from 'path'

/**
 * Seeds the ingredients table from the _dry_ingredient_data.csv_ file.
 * This runs at startup via the _seed.js_ script on the `pnpm seed` command
 *
 * 1. Checks the current version from SiteSettings.
 * 2. Checks if the current version is less than the expected version.
 * 3. If the version is less than the expected version, this function:
 *    a. Clears the existing data in the Ingredient table.
 *    b. Reads the CSV file using csv-parser with proper configuration.
 *    c. Seeds the Ingredient table with the data from the CSV file.
 *    d. Updates the version in SiteSettings to the expected version.
 * 4. If the version is not less than the expected version, logs a message indicating the data is up to date.
 *
 *
 * @async
 * @function
 * @param {PrismaClient} prismaClient - The Prisma client instance to interact with the database.
 */
export async function seedIngredients(prismaClient) {
	try {
		const folderPath = './src/lib/data/ingredients' // Specify the folder path

		const filePath = path.join(folderPath, 'dry_ingredient_data.csv')

		if (!fs.existsSync(filePath)) {
			console.log('dry_ingredient_data.csv not found, cannot continue seeding.')
			return
		}

		// Check the current version from SiteSettings
		const siteSettings = await prismaClient.siteSettings.findFirst()
		const currentVersion = siteSettings?.version || 0

		// Define the expected version
		const expectedVersion = ingVersion // Change this as needed

		// Proceed with seeding if currentVersion is less than expectedVersion
		if (currentVersion < expectedVersion) {
			// Clear the existing data in the Ingredient table
			await prismaClient.ingredient.deleteMany()

			// Read the CSV file using csv-parser with proper configuration
			const rows = []
			await new Promise((resolve, reject) => {
				fs.createReadStream(filePath)
					.pipe(csv({ separator: ',' })) // Specify the separator as a comma
					.on('data', (row) => {
						const name = row.name
						const gramsPerCup = parseFloat(row.gramsPerCup)

						// Add the data to the rows array
						rows.push({
							name: name,
							gramsPerCup: gramsPerCup
						})
					})
					.on('end', resolve)
					.on('error', reject)
			})

			// Begin the transaction
			await prismaClient.$transaction(
				rows.map((row) => prismaClient.ingredient.create({ data: row }))
			)

			console.log(`Data from ${filePath} has been seeded.`)

			// Update the version in SiteSettings
			await prismaClient.siteSettings.update({
				where: { id: siteSettings?.id || 1 },
				data: { version: expectedVersion }
			})

			// Clear the ingredient cache to ensure fresh data is used
			clearIngredientCache()

			console.log(`Ingredient data was seeded from v${currentVersion} to v${expectedVersion}.`)
		} else {
			console.log(`Ingredient data is up to date: v${currentVersion}`)
		}
	} catch (error) {
		console.error('Error seeding data:', error)
	}
}
