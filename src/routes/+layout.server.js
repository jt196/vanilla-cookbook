// src/routes/+layout.server.js
import { redirect } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import {
	getPasswordRequirements,
	getPasswordRequirementsDescription
} from '$lib/utils/security.js'
import { langFromAcceptHeader } from '$lib/i18n/index.js'

export const load = async ({ locals, url, request }) => {
	const { dbSeeded } = locals.site
	if (!dbSeeded && !url.pathname.startsWith('/setup')) {
		throw redirect(302, '/setup')
	}

	// Logged-in users use their saved preference; guests fall back to Accept-Language.
	const lang =
		locals.user?.language ?? langFromAcceptHeader(request.headers.get('accept-language'))

	return {
		user: locals.user,
		settings: locals.site.settings,
		dbSeed: dbSeeded,
		semanticEnabled: locals.site?.semantic?.enabled ?? false,
		passwordRequirements: getPasswordRequirements(env),
		passwordRequirementsDescription: getPasswordRequirementsDescription(env),
		lang
	}
}
