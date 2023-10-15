import PrismaClientPkg from '@prisma/client'
import { fail } from '@sveltejs/kit'
import lucia from 'lucia-auth'
import 'lucia-auth/polyfill/node'
import { sveltekit } from 'lucia-auth/middleware'
import prisma from '@lucia-auth/adapter-prisma'
import { promises as fsPromises } from 'fs'
import { config } from 'dotenv'
import fs from 'fs'
import csv from 'csv-parser'
import path from 'path'

config()

// // Prisma doesn't support ES Modules so we have to do this
const PrismaClient = PrismaClientPkg.PrismaClient
// Different name of prismaC as the auth is importing prisma from the adapter
const prismaC = new PrismaClient({
	errorFormat: 'pretty',
	datasources: {
		db: {
			// url: 'file:./db/dev.sqlite?connection_limit=1'
			url: 'file:./db/dev.sqlite'
			// connectionTimeout: 60000 // Increase the timeout to 60 seconds (adjust as needed)
		}
	}
})

// Have to invoke the auth module here as it's outside the project directory.
export const auth = lucia({
	adapter: prisma(new PrismaClient()),
	env: 'DEV',
	middleware: sveltekit()
})

const adminEmail = process.env.ADMIN_EMAIL || 'email@example.com'
const adminUser = process.env.ADMIN_USER || 'user'
const adminName = process.env.ADMIN_NAME || 'User Name'
const adminPassword = process.env.ADMIN_PASSWORD || 'cookbook'

async function addUsersToDB(users) {
	for (const user of users) {
		// Destructuring the data created above to pass to Lucia
		const { name, username, password, email, about, isAdmin, isRoot } = user
		try {
			await auth.createUser({
				primaryKey: {
					providerId: 'username',
					providerUserId: username,
					password
				},
				attributes: {
					name,
					username,
					email,
					about,
					isAdmin,
					isRoot
				}
			})
		} catch (err) {
			console.error(err)
			return fail(400, { message: 'Could not register user' })
		}
	}
}

// 3. Declare Users to Seed into the DB
function getUsers() {
	// Return all users including admin
	return [
		{
			name: adminName,
			username: adminUser,
			password: adminPassword,
			email: adminEmail,
			about: 'Site root',
			isAdmin: true,
			isRoot: true
		}
	]
}

async function seedIngredients() {
	try {
		const folderPath = './src/lib/data/ingredients' // Specify the folder path

		// Get a list of all files in the folder
		const files = fs.readdirSync(folderPath)

		// Filter files that match the pattern 'ingredient_*.csv'
		const csvFiles = files.filter((file) => /^ingredients_.*\.csv$/.test(file))

		if (csvFiles.length === 0) {
			console.log('No CSV files matching the pattern found, cannot continue seeding.')
			return
		}

		// Check the current version from SiteSettings
		const siteSettings = await prismaC.siteSettings.findFirst()
		const currentVersion = siteSettings?.version || 0

		// Define the expected version
		const expectedVersion = 2.36 // Change this as needed

		// Proceed with seeding if currentVersion is less than expectedVersion
		if (currentVersion < expectedVersion) {
			// Clear the existing data in the Ingredient table
			await prismaC.ingredient.deleteMany()

			// Loop through each CSV file
			for (const csvFile of csvFiles) {
				const filePath = path.join(folderPath, csvFile)
				console.log('🚀 ~ file: seed.js:107 ~ seedIngredients ~ filePath:', filePath)

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
				await prismaC.$transaction(rows.map((row) => prismaC.ingredient.create({ data: row })))

				console.log(`Data from ${csvFile} has been seeded.`)
			}

			// Update the version in SiteSettings
			await prismaC.siteSettings.update({
				where: { id: siteSettings?.id || 1 },
				data: { version: expectedVersion }
			})

			console.log('All data has been seeded.')
		} else {
			console.log('Data is up to date. No need to seed.')
		}
	} catch (error) {
		console.error('Error seeding data:', error)
	}
}

// 5. Get Admin User ID
async function getRootUserId() {
	const rootUser = await prismaC.authUser.findFirst({
		where: { isRoot: true }
	})
	return rootUser ? rootUser.id : null
}

async function seed() {
	try {
		let fileExists = true
		try {
			await fsPromises.access('./prisma/db/dev.sqlite')
		} catch (error) {
			// Error out if db doesn't exist already
			console.log('Database file does not exist, cannot continue!')
			fileExists = false
			return
		}
		if (fileExists) {
			console.log('Database File exists!')
			// Do something (or nothing!) if the DB already exists e.g.
			// await prismaC.authUser.deleteMany()
			// await prismaC.article.deleteMany()
			// await prismaC.recipe.deleteMany()
			// await prismaC.recipeCategory.deleteMany()
		}

		const settingsExists = await prismaC.siteSettings.findFirst()
		if (!settingsExists) {
			await prismaC.siteSettings.create({
				data: {
					registrationAllowed: false
				}
			})
		}

		await seedIngredients()

		// Try to get the admin user from the db
		let rootUserId = await getRootUserId()
		if (rootUserId) {
			console.log('Database is already seeded with root user.')
			await prismaC.$disconnect()
			return
		}

		const users = getUsers()
		await addUsersToDB(users)
	} catch (error) {
		console.error('Error in seeding:', error.message)
	} finally {
		await prismaC.$disconnect()
	}
}

seed()
