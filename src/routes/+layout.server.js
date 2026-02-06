// src/routes/+layout.server.js
import { redirect } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import { getPasswordRequirements, getPasswordRequirementsDescription } from '$lib/utils/security.js'

export const load = async ({ locals, url }) => {
	const { dbSeeded } = locals.site
	if (!dbSeeded && url.pathname !== '/') {
		throw redirect(302, '/')
	}

	return {
		user: locals.user,
		settings: locals.site.settings,
		dbSeed: dbSeeded,
		passwordRequirements: getPasswordRequirements(env),
		passwordRequirementsDescription: getPasswordRequirementsDescription(env)
	}
}
