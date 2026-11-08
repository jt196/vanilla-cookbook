import { importers } from '$lib/utils/import/registry.js'

/**
 * The import formats the Import page offers (id, label, accepted extensions, help text).
 *
 * @returns {Promise<Response>}
 */
export async function GET() {
	const types = Object.entries(importers).map(([id, cfg]) => ({
		id,
		label: cfg.label,
		accepts: cfg.accepts,
		info: cfg.info || ''
	}))
	return new Response(JSON.stringify({ types }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' }
	})
}
