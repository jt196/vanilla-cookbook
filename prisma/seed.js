import PrismaClientPkg from '@prisma/client'
import lucia from 'lucia-auth'
import { sveltekit } from 'lucia-auth/middleware'
import prisma from '@lucia-auth/adapter-prisma'
import { fail } from '@sveltejs/kit'
import { promises as fsPromises } from 'fs'
import fs from 'fs'
import { addCategoriesToDB, loadCategories } from '../src/lib/utils/paprikaAPI.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { extractRecipes, filterRecipeData } from '../src/lib/utils/recipeImport.js'

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

const staticDir = path.join(__dirname, '../static/recipe_photos') // Adjust the path to point to the root /static folder

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
		const recipesPath = path.join(__dirname, '../src/lib/data/recipes.paprikarecipes') // Adjust the filename
		let recipes = await extractRecipes(recipesPath)
		return recipes
	} catch (error) {
		console.error('Error loading recipes:', error.message)
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
			const { categories, photo_data, photos, photo, ...otherRecipeFields } = recipe

			// photos ? console.log('You need to do something with these photos!') : null

			// Save the photo to the /static folder
			if (photo_data && photo) {
				const imagePath = path.join(staticDir, photo)

				// Check if the photo already exists
				if (!fs.existsSync(imagePath)) {
					const imageBuffer = Buffer.from(photo_data, 'base64')
					await fsPromises.writeFile(imagePath, imageBuffer)
				} else {
					console.log(`Photo ${photo} already exists. Skipping...`)
				}
			}

			// Ensure all categories exist and get their uids
			const categoryUids = await Promise.all(
				categories.map(async (categoryName) => {
					let category = await prismaC.category.findFirst({
						where: { name: categoryName }
					})

					// If the category doesn't exist in the database, create it
					if (!category) {
						console.log(`Creating new category: ${categoryName}`)
						category = await prismaC.category.create({
							data: { name: categoryName, userId: adminUserId }
						})
					}

					return category.uid
				})
			)

			// Create the recipe
			const createdRecipe = await prismaC.recipe.create({
				data: {
					...otherRecipeFields,
					created: new Date(otherRecipeFields.created),
					photo,
					userId: adminUserId
				}
			})

			// Link the recipe to its categories in the RecipeCategory join table
			await Promise.all(
				categoryUids.map((categoryUid) => {
					// console.log(`Linking recipe ${createdRecipe.uid} to category ${categoryUid}`)
					return prismaC.recipeCategory.create({
						data: {
							recipeUid: createdRecipe.uid,
							categoryUid: categoryUid
						}
					})
				})
			)

			return createdRecipe
		})
	)
}

// 8. Add Recipes to DB
async function addRecipesToDB(recipes) {
	for (const recipe of recipes) {
		recipe.created = new Date(recipe.created)
		let filteredRecipe = filterRecipeData(recipe)
		await prismaC.recipe.create({ data: filteredRecipe })
	}
}

async function seed() {
	try {
		let fileExists = true
		try {
			await fsPromises.access('./prisma/dev.db')
		} catch (error) {
			fileExists = false
		}
		if (fileExists) {
			await prismaC.authUser.deleteMany()
			await prismaC.article.deleteMany()
			await prismaC.recipe.deleteMany()
			await prismaC.recipeCategory.deleteMany()
		}

		const users = getUsers()
		await addUsersToDB(users)

		const adminUserId = await getAdminUserId()
		const categories = await loadCategories()
		await addCategoriesToDB(categories, adminUserId)

		const rawRecipes = await loadRecipes()
		const recipes = await declareRecipes(rawRecipes, adminUserId)
		await addRecipesToDB(recipes)
	} catch (error) {
		console.error('Error in seeding:', error.message)
	} finally {
		await prismaC.$disconnect()
	}
}

seed()
