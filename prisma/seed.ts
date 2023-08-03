import PrismaClientPkg from '@prisma/client'
import lucia from 'lucia-auth'
import { sveltekit } from 'lucia-auth/middleware'
import prisma from '@lucia-auth/adapter-prisma'
import { fail } from '@sveltejs/kit'

import * as fs from 'fs'

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

function getUsers() {
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
				create: [
					{
						title: 'My favourite recipe',
						content: 'Add some capiscum, stir'
					},
					{
						title: 'Smelly Pooh Rag',
						content: "I wouldn't recommend eating this!"
					},
					{
						title: 'Toe Cheese',
						content: 'Imagine the smelliest thing, this is worse.'
					}
				]
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
