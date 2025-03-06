import { error } from '@sveltejs/kit'
import { prisma } from '$lib/server/prisma'

export const load = async ({ locals }) => {
	const session = await locals.auth.validate()
	const user = session?.user

	if (!session || !user) {
		error(401, 'Unauthorized');
	}

	if (!user.isAdmin) {
		// Assuming 'isAdmin' is a field in your user object
		error(403, 'Forbidden');
	}

	// Fetch users
	const settings = await prisma.siteSettings.findFirst()

	return { settings }
}
