import PrismaClientPkg from '@prisma/client'
import lucia from 'lucia-auth'
import { sveltekit } from 'lucia-auth/middleware'
import prisma from '@lucia-auth/adapter-prisma'
import { fail } from '@sveltejs/kit'
import { promises as fs } from 'fs'
import { addCategoriesToDB, loadCategories } from '../src/lib/utils/paprikaAPI.js'
import path from 'path'
import { fileURLToPath } from 'url'

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

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const recipesPath = path.join(__dirname, '../src/lib/data/firstRecipe.json')

/**
 * Process an array of PaprikaRecipes
 * @param {PaprikaRecipe[]} recipes - An array of PaprikaRecipe objects.
 */
// 3. Declare Users to Seed into the DB
function getUsers() {
	// Return all users including admin
	return [
		{
			name: 'james',
			username: 'jt196',
			password: 'homersdad',
			email: 'jamestorr@gmail.com',
			about: 'Administrator of the site',
			isAdmin: true
		},
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

// 5. Get Admin User ID
async function getAdminUserId() {
	const adminUser = await prismaC.authUser.findFirst({
		where: { isAdmin: true }
	})
	return adminUser.id
}

// 6. Load Recipes
async function loadRecipes() {
	try {
		const data = await fs.readFile(recipesPath, 'utf-8')
		return JSON.parse(data)
	} catch (error) {
		if (error.code === 'ENOENT') {
			console.log('Unable to read firstRecipe.json file')
		} else {
			console.error('Error loading recipes:', error.message)
		}
		return []
	}
}

async function addUsersToDB(users) {
	for (const user of users) {
		// // I'm not running this as I have the lucia seed command to run
		// await prismaC.authUser.create({ data: user });

		// Destructuring the data created above to pass to Lucia
		const { name, username, password, email, about, isAdmin } = user
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
					isAdmin
				}
			})
		} catch (err) {
			console.error(err)
			return fail(400, { message: 'Could not register user' })
		}
	}
}

async function declareRecipes(recipes, adminUserId) {
	return Promise.all(
		recipes.map(async (recipe) => {
			const { categories, ...otherRecipeFields } = recipe

			// Get uids for each category name
			const categoryUids = await Promise.all(
				categories.map(async (categoryName) => {
					const category = await prismaC.category.findFirst({
						where: { name: categoryName }
					})

					// If the category doesn't exist in the database, create it
					if (!category) {
						const newCategory = await prismaC.category.create({
							data: { name: categoryName }
						})
						return newCategory.uid
					}

					return category.uid
				})
			)

			return {
				...otherRecipeFields,
				userId: adminUserId,
				categories: {
					create: categoryUids.map((uid) => {
						return {
							category: {
								connect: { uid: uid }
							}
						}
					})
				}
			}
		})
	)
}

// 8. Add Recipes to DB
async function addRecipesToDB(recipes) {
	for (const recipe of recipes) {
		recipe.created = new Date(recipe.created)
		await prismaC.recipe.create({ data: recipe })
	}
}

async function seed() {
	try {
		let fileExists = true
		try {
			await fs.access('./prisma/dev.db')
		} catch (error) {
			fileExists = false
		}
		if (fileExists) {
			await prismaC.authUser.deleteMany()
			await prismaC.article.deleteMany()
			await prismaC.recipe.deleteMany()
		}

		const users = getUsers()
		await addUsersToDB(users)

		const adminUserId = await getAdminUserId()
		const categories = await loadCategories()
		await addCategoriesToDB(categories, adminUserId)

		const rawRecipes = await loadRecipes()
		console.log('🚀 ~ file: seed.js:184 ~ seed ~ rawRecipes:', rawRecipes)
		const recipes = await declareRecipes(rawRecipes, adminUserId)
		console.log('🚀 ~ file: seed.js:185 ~ seed ~ recipes:', recipes)
		await addRecipesToDB(recipes)
	} catch (error) {
		console.error('Error in seeding:', error.message)
	} finally {
		await prismaC.$disconnect()
	}
}

seed()
