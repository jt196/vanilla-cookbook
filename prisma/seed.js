import PrismaClientPkg from '@prisma/client'
import lucia from 'lucia-auth'
import { LuciaError } from 'lucia-auth'
import { sveltekit } from 'lucia-auth/middleware'
import prisma from '@lucia-auth/adapter-prisma'
import { fail } from '@sveltejs/kit'
import fs from 'fs'
import { importPaprikaCategories, loadPaprikaRecipes } from '../src/lib/utils/recipeImport.js'

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

/**
 * Process an array of PaprikaRecipes
 * @param {PaprikaRecipe[]} recipes - An array of PaprikaRecipe objects.
 */
async function getUsers(recipes) {
	recipes.forEach((entry) => {
		// Convert 'created' string to a datetime object
		entry.created = new Date(entry.created)
	})

	return [
		{
			name: 'matia',
			username: 'joyofcodedev',
			email: 'matia@example.test',
			about: 'Likes long walks on the beach. 😘',
			password: '123456',
			isAdmin: false
		},
		{
			name: 'bob',
			username: 'bobross',
			email: 'bob@example.test',
			about: 'Likes painting.',
			password: 'abcdef',
			isAdmin: false
		}
	]
}

async function seed() {
	// Checking database exists
	const dbFilePath = './prisma/dev.db'
	// Removing tables if it does
	if (fs.existsSync(dbFilePath)) {
		await prismaC.authUser.deleteMany()
		await prismaC.article.deleteMany()
		await prismaC.recipe.deleteMany()
	}
	// Import the Paprika JSON
	const recipes = await loadPaprikaRecipes()
	// Create the admin user first
	const adminUser = {
		name: 'james',
		username: 'jt196',
		password: 'homersdad',
		email: 'jamestorr@gmail.com',
		about: 'Administrator of the site',
		isAdmin: true
	}

	try {
		const createdAdmin = await auth.createUser({
			primaryKey: {
				providerId: 'username',
				providerUserId: adminUser.username,
				password: adminUser.password
			},
			attributes: {
				name: adminUser.name,
				username: adminUser.username,
				email: adminUser.email,
				about: adminUser.about,
				isAdmin: adminUser.isAdmin
			}
		})

		// Get the admin user ID
		const adminUserId = await createdAdmin.userId

		// Import categories with the admin user ID
		await importPaprikaCategories(recipes, adminUserId)

		// Associate recipes with the admin user
		const recipesData = recipes.map((recipe) => {
			const { categories, ...otherRecipeFields } = recipe
			return {
				...otherRecipeFields,
				userId: adminUserId, // Associate with the admin user
				categories: categories
					? {
							create: categories.map((category) => {
								return {
									category: {
										connect: { uid: category.uid }
									}
								}
							})
					  }
					: undefined
			}
		})

		for (const recipe of recipesData) {
			recipe.created = new Date(recipe.created)
			await prismaC.recipe.create({ data: recipe })
		}
	} catch (e) {
		if (e instanceof LuciaError && e.message === 'DUPLICATE_KEY_ID') {
			console.error('A user with the same key already exists.')
		} else {
			console.error('Error creating user:', e.message)
		}
	}

	// Create user object for importing into DB
	const users = await getUsers(recipes)

	for (const user of users) {
		// // I'm not running this as I have the lucia seed command to run
		// await prismaC.authUser.create({ data: user });

		// Destructuring the data created above to pass to Lucia
		const { name, username, password, email, about, isAdmin, articles, recipes } = user
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
					articles,
					recipes
				}
			})
		} catch (err) {
			console.error(err)
			return fail(400, { message: 'Could not register user' })
		}
	}
}

seed()
