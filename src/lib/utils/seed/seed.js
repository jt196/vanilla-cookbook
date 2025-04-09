// scripts/seed.js
import { PrismaClient } from '@prisma/client'
import { seedIngredients } from './seedIng.js' // adjust the path appropriately

const prisma = new PrismaClient()

/**
 * Seeds the database with initial data by creating site settings and running
 * the ingredient seeder.
 *
 * On set up, it sets the version number to 0, so the `seedIngredients()` populates the db.
 *
 * This runs when the dev or docker starts and shouldn't do anything if
 *
 * - The database is already seeded
 * - The ingredients are up to date - this is determined by the version
 * number in the siteSettings saved inside the db, and the version number in
 * the _config.js_ file.
 *
 * Updating ingredients is fairly simple
 *
 * 1. Add any new lines to the _data/ingredients/dry_ingredient_data.csv_ file
 * 2. Update the version number in the _config.js_ file.
 * e.g. `export const ingVersion = 2.38` -> `2.39`
 *
 *
 * @async
 * @function
 * @returns {Promise<void>}
 */
async function runSeed() {
	try {
		// Check if SiteSettings already exists
		const existingSettings = await prisma.siteSettings.findFirst()
		if (!existingSettings) {
			// Create site settings with initial values
			await prisma.siteSettings.create({
				data: {
					registrationAllowed: false,
					version: 0
				}
			})
			console.log('Site settings created.')
		} else {
			console.log('Site settings already exist. No need to create.')
		}

		// Now seed ingredients
		await seedIngredients(prisma)
	} catch (error) {
		console.error('Seeding failed:', error)
	} finally {
		await prisma.$disconnect()
	}
}

runSeed()
