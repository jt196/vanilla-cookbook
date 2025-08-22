import { importers } from '$lib/utils/import/registry.js'

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
