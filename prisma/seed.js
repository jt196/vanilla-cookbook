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

config()

// // Prisma doesn't support ES Modules so we have to do this
const PrismaClient = PrismaClientPkg.PrismaClient
// Different name of prismaC as the auth is importing prisma from the adapter
const prismaC = new PrismaClient()

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
		// Check if the CSV file exists
		const fileExists = await fs.promises
			.access('./src/lib/data/ingredients/dry_ingredient_data.csv')
			.then(() => true)
			.catch(() => false)

		if (!fileExists) {
			console.log('CSV file does not exist, cannot continue seeding.')
			return
		}

		// Check the current version from SiteSettings
		const siteSettings = await prismaC.siteSettings.findFirst()
		const currentVersion = siteSettings?.version || 0

		// Define the expected version
		const expectedVersion = 1 // Change this as needed

		// Proceed with seeding if currentVersion is less than expectedVersion
		if (currentVersion < expectedVersion) {
			const data = []

			// Clear the existing data in the Ingredient table
			await prismaC.ingredient.deleteMany()

			// Read the CSV file using csv-parser with proper configuration
			fs.createReadStream('./src/lib/data/ingredients/dry_ingredient_data.csv')
				.pipe(csv({ separator: ',' })) // Specify the separator as a comma
				.on('data', async (row) => {
					const names = row.names
					const gramsPerCup = parseFloat(row.gramsPerCup)

					// Insert data into the Ingredient table with the full names
					data.push(
						prismaC.ingredient.create({
							data: {
								name: names,
								gramsPerCup: gramsPerCup
							}
						})
					)
				})
				.on('end', async () => {
					// Wait for all data insertions to complete
					await Promise.all(data)

					// Update the version in SiteSettings
					await prismaC.siteSettings.update({
						where: { id: siteSettings?.id || 1 },
						data: { version: expectedVersion }
					})

					console.log('Data has been seeded.')
				})
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
