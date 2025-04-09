// src/routes/api/site/seed/+server.js
import { json } from '@sveltejs/kit'
import { dbExists, seedRecipes } from '$lib/utils/seed/seedHelpers'
import { seedIngredients } from '$lib/utils/seed/seedIng'
import { execSync } from 'child_process'
import { prisma as client } from '$lib/server/prisma'
import { auth } from '$lib/server/lucia'

/**
 * POST /api/site/seed
 *
 * Expects a JSON body with a "user" object:
 * {
 *   user: {
 *     adminName: string,
 *     adminUser: string,
 *     adminEmail: string,
 *     adminUnits: string,
 *     adminLanguage: string,
 *     adminPassword: string
 *   }
 * }
 */
export async function POST({ request }) {
	try {
		const { adminUser } = await request.json()
		const {
			adminName,
			adminUsername,
			adminEmail,
			adminPassword,
			adminUnits,
			adminLanguage,
			recipeSeed
		} = adminUser
		console.log('🚀 ~ POST ~ adminUser:', adminUser)

		// Basic validation
		if (
			!adminName ||
			!adminUsername ||
			!adminEmail ||
			!adminPassword ||
			!adminLanguage ||
			!adminUnits
		) {
			return json({ error: 'All fields are required.' }, { status: 400 })
		}

		// Check if the database file exists. If not, run migrations.
		const db = await dbExists()
		if (!db) {
			console.log('Database file does not exist. Running migrations...')
			execSync('pnpm dev:setup', { stdio: 'inherit' })
		}

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
				units: adminUnits,
				language: adminLanguage,
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
