// src/routes/+page.server.js
import { redirect } from '@sveltejs/kit'
import { dbExists, dbSeeded } from '$lib/utils/seedHelpers.js'
import { prisma } from '$lib/server/prisma'

export const load = async ({ locals }) => {
	// Check if the SQLite database file exists
	const db = await dbExists()
	const dbSeed = await dbSeeded(prisma)
	console.log('🚀 ~ load ~ db:', db)

	// If the database exists and successfully seeded, validate the session and redirect accordingly.
	if (db && dbSeed) {
		console.log('Found db!')
		const session = await locals.auth.validate()
		if (session && session.user) {
			console.log('Redirecting to recipes!')
			throw redirect(302, `/user/${session.user.userId}/recipes`)
		} else {
			console.log('Redirecting to login!')
			throw redirect(302, '/login')
		}
	}

	// Otherwise, let the UI know that the database is not yet seeded.
	return {
		db,
		dbSeed
	}
}
