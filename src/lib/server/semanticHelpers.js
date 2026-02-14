import { jsonError } from '$lib/server/authHelpers'
import { env } from '$env/dynamic/private'
import { resolveEmbeddingProvider } from '$lib/utils/llmModels'

/**
 * Check whether semantic embedding jobs should run.
 *
 * @param {string | null} [preferredProvider=null]
 * @returns {boolean}
 */
export function semanticEmbeddingJobsEnabled(preferredProvider = null) {
	return !!resolveEmbeddingProvider(preferredProvider, env)
}

/**
 * Resolve semantic-search availability for a request.
 *
 * Semantic search is enabled only when:
 * 1. Provider capability exists
 * 2. Site-level setting allows it
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
