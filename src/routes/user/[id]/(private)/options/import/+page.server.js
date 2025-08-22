// src/routes/(protected)/import/+page.server.js
import { fail } from '@sveltejs/kit'
import { importers } from '$lib/utils/import/registry.js'
import { fileTypeFromBuffer } from 'file-type'

export async function load({ fetch }) {
	const fallback = {
		importTypes: [
			{ id: 'paprika', label: 'Paprika (.paprikarecipes)', accepts: ['.paprikarecipes'] }
		]
	}
	try {
		const res = await fetch('/api/recipe/import/types')
		if (!res.ok) return fallback
		const data = await res.json()
		return { importTypes: data.types || [] }
	} catch (e) {
		console.error('Failed to fetch import types:', e)
		return fallback
	}
}

export const actions = {
	importRecipes: async ({ request, locals }) => {
		const session = await locals.auth.validate()
		const user = session?.user
		if (!user) return fail(401, { error: 'Not authenticated.' })

		// ✅ Guard: only parse FormData if it's actually multipart
		const ct = request.headers.get('content-type') || ''
		if (!ct.toLowerCase().includes('multipart/form-data')) {
			return fail(415, {
				error: 'Expected multipart/form-data (did the form include enctype="multipart/form-data"?).'
			})
		}

		const form = await request.formData()
		const type = form.get('type')
		const isPublic = !!form.get('isPublic')
		const file = form.get('file')

		if (!type || !importers[type]) return fail(400, { error: 'Unknown import type.' })
		if (!(file && typeof file.arrayBuffer === 'function'))
			return fail(400, { error: 'No file uploaded.' })

		const ext = '.' + (file.name?.split('.').pop() || '').toLowerCase()
		const accepts = importers[type].accepts || []
		if (accepts.length && !accepts.includes(ext)) {
			return fail(400, { error: `File extension not allowed for ${importers[type].label}.` })
		}

		const buffer = Buffer.from(await file.arrayBuffer())

		try {
			const impl = importers[type]

			if (typeof impl.magicOk === 'function') {
				const kind = await fileTypeFromBuffer(buffer) // { ext, mime } or null
				const ok = await impl.magicOk(kind)
				if (!ok) return fail(400, { error: 'File type not recognized/allowed.' })
			}

			if (typeof impl.run !== 'function') {
				return fail(500, { error: `Importer "${type}" has no run() function.` })
			}

			const result = await impl.run({
				buffer,
				filename: file.name,
				userId: user.userId,
				isPublic
			})

			return {
				message:
					result.message ||
					`Imported ${result.inserted} recipe(s)` +
						(result.skipped ? `, skipped ${result.skipped}.` : '.')
			}
		} catch (e) {
			console.error(e)
			return fail(500, { error: e.message || 'Failed to import file.' })
		}
	}
}
