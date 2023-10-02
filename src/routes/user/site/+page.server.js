import { error } from '@sveltejs/kit'
import { prisma } from '$lib/server/prisma'

export const load = async ({ locals }) => {
	const { session, user } = await locals.auth.validateUser()

	if (!session || !user) {
		throw error(401, 'Unauthorized')
	}

	if (!user.isAdmin) {
		// Assuming 'isAdmin' is a field in your user object
		throw error(403, 'Forbidden')
	}

	// Fetch users
	const settings = await prisma.siteSettings.findFirst()

	return { settings }
}
