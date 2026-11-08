// src/routes/api/site/seed/+server.js
import { dbExists, seedRecipes } from '$lib/utils/seed/seedHelpers'
import { seedIngredients } from '$lib/utils/seed/seedIng'
import { clearIngredientCache } from '$lib/utils/converterBackend'
import { execSync } from 'child_process'
import { prisma as client } from '$lib/server/prisma'
import { auth } from '$lib/server/lucia'
import { validatePassword } from '$lib/utils/security.js'
import { env } from '$env/dynamic/private'
import { jsonError, jsonSuccess } from '$lib/server/authHelpers'

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
	// Initial setup is one-time only
	if (locals.site?.dbSeeded) {
		return jsonError(403, { error: 'Site is already set up.', code: 'setup.msg.alreadySeeded' })
	}

	try {
		const { adminUser } = await request.json()
		const { adminUsername, adminEmail, adminPassword, adminUnits, adminLanguage, recipeSeed } =
			adminUser ?? {}

		if (!adminUsername || !adminEmail || !adminPassword) {
			return jsonError(400, {
				error: 'All fields are required.',
				code: 'setup.msg.allFieldsRequired'
			})
		}

		const passwordValidation = validatePassword(adminPassword, env)
		if (!passwordValidation.isValid) {
			return jsonError(400, {
				error: passwordValidation.message,
				code: passwordValidation.messageCode,
				vars: passwordValidation.messageVars
			})
		}

		// Check if the database file exists. If not, run migrations.
		if (!(await dbExists())) {
			console.log('Database file does not exist. Running migrations...')
			execSync('pnpm dev:setup', { stdio: 'inherit' })
		}

		// Re-check in case two setup requests arrive together
		if (await client.authUser.findFirst({ select: { id: true } })) {
			return jsonError(403, { error: 'Site is already set up.', code: 'setup.msg.alreadySeeded' })
		}

		const newUser = await auth.createUser({
			key: { providerId: 'username', providerUserId: adminUsername, password: adminPassword },
			attributes: {
				username: adminUsername,
				units: adminUnits,
				language: adminLanguage,
				email: adminEmail,
				isAdmin: true,
				isRoot: true
			}
		})

		await seedIngredients(client)
		// The ingredient search index may have been built (empty) before setup ran
		clearIngredientCache()
		if (recipeSeed) await seedRecipes(newUser.userId, client)

		const session = await auth.createSession({ userId: newUser.userId, attributes: {} })
		await locals.auth.setSession(session)

		return jsonSuccess({
			success: true,
			id: newUser.userId,
			message: 'Database seeded successfully.',
			code: 'setup.msg.seeded'
		})
	} catch (error) {
		console.error('Error seeding DB:', error)
		return jsonError(500, {
			error: `Failed to seed DB: ${error.message}`,
			code: 'setup.msg.seedFailed'
		})
	}
}
