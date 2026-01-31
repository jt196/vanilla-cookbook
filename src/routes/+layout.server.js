// src/routes/+layout.server.js
import { env } from '$env/dynamic/private'
import {
	getPasswordRequirements,
	getPasswordRequirementsDescription
} from '$lib/utils/security.js'

export const load = async ({ locals }) => {
	// this loader should not redirect; just provide data
	return {
		user: locals.user,
		settings: locals.site.settings,
		dbSeed: locals.site.dbSeeded,
		passwordRequirements: getPasswordRequirements(env),
		passwordRequirementsDescription: getPasswordRequirementsDescription(env)
	}
}
