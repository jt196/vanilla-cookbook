import PrismaClientPkg from '@prisma/client'
import lucia from 'lucia-auth'
import { sveltekit } from 'lucia-auth/middleware'
import prisma from '@lucia-auth/adapter-prisma'
import { fail } from '@sveltejs/kit'
import fs from 'fs'
import { promises as fsPromises } from 'fs'
import type { Recipe, Category } from '../src/lib/types'

let recipes: Recipe[] = []

async function loadRecipes(): Promise<Recipe[]> {
	const filePath = 'src/lib/data/recipes-small.json'

	if (!fs.existsSync(filePath)) {
		console.log('File does not exist:', filePath)
		return []
	}

	try {
		const jsonString = await fsPromises.readFile(filePath, 'utf8')
		return JSON.parse(jsonString)
	} catch (err) {
		console.log('An error occurred:', err)
		return []
	}
}

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

async function getUsers() {
	recipes = await loadRecipes()
	recipes.forEach((entry) => {
		// Convert 'created' string to a datetime object
		entry.created = new Date(entry.created)
	})
	// Collecting all unique categories
	const categoriesMap: { [key: string]: Category } = {}

	recipes.forEach((recipe) => {
		recipe.categories
			? recipe.categories.forEach((category) => {
					categoriesMap[category.uid] = category as Category
			  })
			: undefined
	})

	// Gather all unique parent UIDs
	const parentUids: Set<string> = new Set()

	Object.values(categoriesMap).forEach((category) => {
		if (category.parent_uid) {
			parentUids.add(category.parent_uid)
		}
	})

	// Create parent categories if they don't exist
	for (const parentUid of parentUids) {
		const existingCategory = await prismaC.category.findUnique({
			where: { uid: parentUid }
		})

		if (!existingCategory) {
			await prismaC.category.create({
				data: { uid: parentUid } // Only the UID is needed
			})
		}
	}

	// Creating or updating categories, connecting to parents if applicable
	for (const category of Object.values(categoriesMap)) {
		const existingCategory = await prismaC.category.findUnique({
			where: { uid: category.uid }
		})

		const categoryData = {
			uid: category.uid,
			order_flag: category.order_flag,
			name: category.name,
			parent: category.parent_uid
				? {
						connect: { uid: category.parent_uid }
				  }
				: undefined
		}

		if (existingCategory) {
			// Update if it exists
			await prismaC.category.update({
				where: { uid: category.uid },
				data: categoryData
			})
		} else {
			// Create if it doesn't exist
			await prismaC.category.create({
				data: categoryData
			})
		}
	}

	return [
		{
			name: 'james',
			username: 'jt196',
			email: 'jamestorr@gmail.com',
			about: 'Administrator of the site',
			password: 'homersdad',
			isAdmin: true,
			articles: {
				create: [
					{
						title: 'My best work',
						content: 'Ipsum, capsicum, dolores etc'
					},
					{
						title: 'A piece of shite',
						content: "I'm so imbarist this isn't my best work."
					},
					{
						title: 'Oh Dear',
						content: 'This is even worst than my larst piece.'
					}
				]
			},
			recipes: {
				create: recipes.map((recipe) => {
					// Extract the categories field from the recipe
					const { categories, ...otherRecipeFields } = recipe

					return {
						...otherRecipeFields, // Spread the rest of the recipe fields
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
							: undefined // If categories don't exist, leave the field undefined
					}
				})
			}
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

async function seed() {
	// Checking database exists
	const dbFilePath = './prisma/dev.db'
	// Removing tables if it does
	if (fs.existsSync(dbFilePath)) {
		await prismaC.authUser.deleteMany()
		await prismaC.article.deleteMany()
		await prismaC.recipe.deleteMany()
	}
	const users = await getUsers()
	// Grab recipe data
	// let recipes = await

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
