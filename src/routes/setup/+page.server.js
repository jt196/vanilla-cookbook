import { redirect } from '@sveltejs/kit'
import { getPasswordRequirements, getPasswordRequirementsDescription } from '$lib/utils/security.js'
import { env } from '$env/dynamic/private'

export const load = async ({ locals }) => {
	if (locals.site.dbSeeded) {
		throw redirect(302, '/')
	}

	return {
		passwordRequirements: getPasswordRequirements(env),
		passwordRequirementsDescription: getPasswordRequirementsDescription(env)
	}
}
