import PrismaClientPkg from '@prisma/client'
import { fail } from '@sveltejs/kit'
import lucia from 'lucia-auth'
import 'lucia-auth/polyfill/node'
import { sveltekit } from 'lucia-auth/middleware'
import prisma from '@lucia-auth/adapter-prisma'
import { promises as fsPromises } from 'fs'
import { config } from 'dotenv'

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

		// Try to get the admin user from the db
		let rootUserId = await getRootUserId()
		if (rootUserId) {
			console.log('Database is already seeded.')
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
