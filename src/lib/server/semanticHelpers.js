import { jsonError } from '$lib/server/authHelpers'

/**
 * Resolve semantic-search availability for a request.
 *
 * Semantic search is enabled only when:
 * 1. Env capability is enabled
 * 2. Provider capability exists
 * 3. Site-level setting allows it
 *
 * @param {import('@sveltejs/kit').RequestEvent['locals']} locals
 * @returns {{ enabled: true } | { enabled: false, reason: string, response: Response }}
 */
export function resolveSemanticAvailability(locals) {
	const semantic = locals?.site?.semantic
	if (!semantic?.enabled) {
		return {
			enabled: false,
			reason: 'Semantic search is disabled.',
			response: jsonError(503, 'Semantic search is disabled.')
		}
	}

	return { enabled: true }
}
