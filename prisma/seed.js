import PrismaClientPkg from '@prisma/client'
import lucia from 'lucia-auth'
import 'lucia-auth/polyfill/node'
import { sveltekit } from 'lucia-auth/middleware'
import prisma from '@lucia-auth/adapter-prisma'
import { fail } from '@sveltejs/kit'
import { addCategoriesToDB, loadCategories } from '../src/lib/utils/import/paprika/paprikaAPI.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { extractRecipes } from '../src/lib/utils/import/recipeImport.js'
import { savePhoto } from '../src/lib/utils/image/imageBackend.js'
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
const paprikaFile = process.env.PAPRIKA_IMPORT_FILE

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
			name: adminName,
			username: adminUser,
			password: adminPassword,
			email: adminEmail,
			about: 'Administrator of the site',
			isAdmin: true
		}
	]
}

// 5. Get Admin User ID
async function getAdminUserId() {
	const adminUser = await prismaC.authUser.findFirst({
		where: { isAdmin: true }
	})
	return adminUser ? adminUser.id : null
}

// 6. Load Recipes
async function loadRecipes() {
	try {
		const recipesPath = path.join(__dirname, '../src/lib/data/import/', paprikaFile) // Adjust the filename
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

function getFileType(filename) {
	return filename.split('.').pop()
}

async function declareRecipes(rawRecipes) {
	return rawRecipes.map((recipe) => {
		// eslint-disable-next-line no-unused-vars
		const { categories, photo_data, photos, photo_url, photo, ...otherRecipeFields } = recipe
		return {
			...otherRecipeFields,
			created: new Date(otherRecipeFields.created)
		}
	})
}

async function addRecipesToDB(declaredRecipes, adminUserId) {
	const createdRecipes = []
	for (const recipe of declaredRecipes) {
		const createdRecipe = await prismaC.recipe.create({
			data: {
				...recipe,
				userId: adminUserId
			}
		})
		createdRecipes.push(createdRecipe)
	}
	return createdRecipes
}

// Parse a recipe object and create any categories that don't exist
async function ensureCategoriesExist(rawRecipes, adminUserId) {
	const allCategoriesFromRecipes = rawRecipes.flatMap((recipe) => recipe.categories)
	const uniqueCategories = [...new Set(allCategoriesFromRecipes)]

	const existingCategories = await prismaC.category.findMany({
		where: {
			name: {
				in: uniqueCategories
			}
		}
	})

	const existingCategoryNames = existingCategories.map((cat) => cat.name)
	const categoriesToCreate = uniqueCategories.filter(
		(catName) => !existingCategoryNames.includes(catName)
	)

	await Promise.all(
		categoriesToCreate.map((catName) => {
			return prismaC.category.create({
				data: {
					name: catName,
					userId: adminUserId
				}
			})
		})
	)

	return [...existingCategories, ...categoriesToCreate]
}

async function addRecipeCategoriesToDB(createdRecipes, rawRecipes) {
	for (const recipe of createdRecipes) {
		const originalRecipe = rawRecipes.find((raw) => raw.uid === recipe.uid)
		const categoryNames = originalRecipe.categories

		const categories = await prismaC.category.findMany({
			where: {
				name: {
					in: categoryNames
				}
			}
		})

		for (const category of categories) {
			await prismaC.recipeCategory.create({
				data: {
					recipeUid: recipe.uid,
					categoryUid: category.uid
				}
			})
		}
	}
}

async function handlePhotosForRecipes(createdRecipes) {
	for (const recipe of createdRecipes) {
		// Handle the main photo
		if (recipe.photo && recipe.photo_data) {
			await savePhoto(recipe.photo_data, recipe.photo, staticDir)
			await prismaC.recipePhoto.create({
				data: {
					id: recipe.photo.split('.')[0],
					recipeUid: recipe.uid,
					isMain: true,
					fileType: getFileType(recipe.photo)
				}
			})
		}

		// Handle the photos array
		if (recipe.photos && recipe.photos.length > 0) {
			for (const photoObj of recipe.photos) {
				const { data: photoData, filename } = photoObj
				await savePhoto(photoData, filename, staticDir)
				await prismaC.recipePhoto.create({
					data: {
						id: filename.split('.')[0],
						recipeUid: recipe.uid,
						fileType: getFileType(filename)
					}
				})
			}
		}

		// Handle the photo_url
		if (recipe.image_url) {
			await prismaC.recipePhoto.create({
				data: {
					recipeUid: recipe.uid,
					url: recipe.image_url
				}
			})
		}
	}
}

async function seed() {
	try {
		let fileExists = true
		try {
			await fsPromises.access('./prisma/db/dev.sqlite')
		} catch (error) {
			// Error out if db doesn't exist already
			console.log('Database file does not exist!')
			fileExists = false
			return
		}
		if (fileExists) {
			console.log('Database File Exists Already!')
			// Do something (or nothing!) if the DB already exists e.g.
			// await prismaC.authUser.deleteMany()
			// await prismaC.article.deleteMany()
			// await prismaC.recipe.deleteMany()
			// await prismaC.recipeCategory.deleteMany()
		}

		// Try to get the admin user from the db
		let adminUserId = await getAdminUserId()
		if (adminUserId) {
			console.log('Database is already seeded.')
			await prismaC.$disconnect()
			return
		}

		const users = getUsers()
		await addUsersToDB(users)
		adminUserId = await getAdminUserId()

		const categories = await loadCategories()
		await addCategoriesToDB(categories, adminUserId)

		const rawRecipes = await loadRecipes()
		await ensureCategoriesExist(rawRecipes, adminUserId)
		const declaredRecipes = await declareRecipes(rawRecipes)
		const createdRecipes = await addRecipesToDB(declaredRecipes, adminUserId)

		await addRecipeCategoriesToDB(createdRecipes, rawRecipes)
		await handlePhotosForRecipes(rawRecipes)
	} catch (error) {
		console.error('Error in seeding:', error.message)
	} finally {
		await prismaC.$disconnect()
	}
}

seed()
