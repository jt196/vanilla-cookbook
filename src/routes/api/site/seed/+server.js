// src/routes/api/site/seed/+server.js
import { json } from '@sveltejs/kit'
import { dbExists, dbSeeded, seedIngredients, seedRecipes } from '$lib/utils/seedHelpers'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'
import { prisma } from '@lucia-auth/adapter-prisma'
import { prisma as client } from '$lib/server/prisma'
import { auth } from '$lib/server/lucia'
import { lucia } from 'lucia'
import { sveltekit } from 'lucia/middleware'

const isDev = process.env.VITE_ENV === 'development'

/**
 * POST /api/site/seed
 *
 * Expects a JSON body with a "user" object:
 * {
 *   user: {
 *     adminName: string,
 *     adminUser: string,
 *     adminEmail: string,
 *     adminPassword: string
 *   }
 * }
 */
export async function POST({ request }) {
	try {
		const { adminUser } = await request.json()
		const { adminName, adminUsername, adminEmail, adminPassword, recipeSeed } = adminUser

		// Basic validation
		if (!adminName || !adminUsername || !adminEmail || !adminPassword) {
			return json({ error: 'All fields are required.' }, { status: 400 })
		}

		// Check if the database file exists. If not, run migrations.
		const db = await dbExists()
		if (!db) {
			console.log('Database file does not exist. Running migrations...')
			execSync('pnpm dev:setup', { stdio: 'inherit' })
		}

		// // Prevent read only errors!
		// await client.$disconnect()

		// // Instantiate a new client to seed the db
		// const prismaForSeed = new PrismaClient({
		// 	datasources: {
		// 		db: {
		// 			url: 'file:./db/dev.sqlite'
		// 		}
		// 	}
		// })

		// const auth = lucia({
		// 	adapter: prisma(prismaForSeed, {
		// 		user: 'authUser',
		// 		key: 'authKey',
		// 		session: 'authSession'
		// 	}),
		// 	middleware: sveltekit()
		// })

		// Create admin user if not already created.
		await auth.createUser({
			key: {
				providerId: 'username',
				providerUserId: adminUsername,
				password: adminPassword
			},
			attributes: {
				name: adminName,
				username: adminUsername,
				email: adminEmail,
				isAdmin: true,
				isRoot: true
			}
		})

		const newUser = await client.authUser.findUnique({
			where: { username: adminUsername }
		})
		if (!newUser) {
			return new Response(JSON.stringify({ error: 'Admin User not created.' }), {
				status: 400,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		// Create site settings if not already created.
		await client.siteSettings.create({
			data: { registrationAllowed: false }
		})

		// Run the seeding functions.
		await seedIngredients(client)

		if (recipeSeed) {
			await seedRecipes(newUser.id, client)
		}

		await client.$disconnect()

		return new Response(
			JSON.stringify({
				success: true,
				id: newUser.id,
				message: 'Database seeded successfully.'
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	} catch (error) {
		console.error('Error seeding DB:', error)
		return new Response(JSON.stringify({ error: `Failed to seed DB: ${error.message}` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
