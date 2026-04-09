// src/routes/api/site/seed/+server.js
import { json } from '@sveltejs/kit'
import { dbExists, seedRecipes } from '$lib/utils/seed/seedHelpers'
import { seedIngredients } from '$lib/utils/seed/seedIng'
import { execSync } from 'child_process'
import { prisma as client } from '$lib/server/prisma'
import { auth } from '$lib/server/lucia'
import { validatePassword } from '$lib/utils/security.js'
import { env } from '$env/dynamic/private'

/**
 * POST /api/site/seed
 *
 * Expects a JSON body with an "adminUser" object:
 * {
 *   adminUser: {
 *     adminUsername: string,
 *     adminEmail: string,
 *     adminUnits: string,
 *     adminLanguage: string,
 *     adminPassword: string
 *   }
 * }
 */
export async function POST({ request, locals }) {
	try {
		const { adminUser } = await request.json()
		const { adminUsername, adminEmail, adminPassword, adminUnits, adminLanguage, recipeSeed } =
			adminUser

		// Basic validation
		if (!adminUsername || !adminEmail || !adminPassword) {
			return new Response(
				JSON.stringify({ error: 'All fields are required.', code: 'setup.msg.allFieldsRequired' }),
				{
					status: 400,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)
		}

		const passwordValidation = validatePassword(adminPassword, env)
		if (!passwordValidation.isValid) {
			return new Response(
				JSON.stringify({
					error: passwordValidation.message,
					code: passwordValidation.messageCode,
					vars: passwordValidation.messageVars
				}),
				{
					status: 400,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)
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
			return new Response(
				JSON.stringify({ error: 'Admin User not created.', code: 'setup.msg.adminNotCreated' }),
				{
					status: 400,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)
		}

		// Run the seeding functions.
		await seedIngredients(client)

		if (recipeSeed) {
			await seedRecipes(newUser.id, client)
		}

		const session = await auth.createSession({ userId: newUser.id, attributes: {} })
		await locals.auth.setSession(session)

		await client.$disconnect()

		return new Response(
			JSON.stringify({
				success: true,
				id: newUser.id,
				message: 'Database seeded successfully.',
				code: 'setup.msg.seeded'
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
		return new Response(
			JSON.stringify({
				error: `Failed to seed DB: ${error.message}`,
				code: 'setup.msg.seedFailed'
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}
}
