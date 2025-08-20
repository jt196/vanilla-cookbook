// src/routes/+page.server.js
import { redirect } from '@sveltejs/kit'

export const load = async ({ locals }) => {
	const { dbSeeded } = locals.site
	if (!dbSeeded) {
		return { dbSeed: false } // or render a seeding UI
	}

	const user = locals.user
	if (user) {
		throw redirect(302, `/user/${user.userId}/recipes`)
	}
	throw redirect(302, '/login')
}
