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
		if (!user) return fail(401, { messageCode: 'importPage.msg.notAuthenticated' })

		// ✅ Guard: only parse FormData if it's actually multipart
		const ct = request.headers.get('content-type') || ''
		if (!ct.toLowerCase().includes('multipart/form-data')) {
			return fail(415, {
				messageCode: 'importPage.msg.expectedMultipart'
			})
		}

		const form = await request.formData()
		const type = form.get('type')
		const isPublic = !!form.get('isPublic')
		const file = form.get('file')

		if (!type || !importers[type]) return fail(400, { messageCode: 'importPage.msg.unknownType' })
		if (!(file && typeof file.arrayBuffer === 'function'))
			return fail(400, { messageCode: 'importPage.msg.noFile' })

		const ext = '.' + (file.name?.split('.').pop() || '').toLowerCase()
		const accepts = importers[type].accepts || []
		if (accepts.length && !accepts.includes(ext)) {
			return fail(400, {
				messageCode: 'importPage.msg.extensionNotAllowed',
				messageVars: { type: importers[type].label }
			})
		}

		const buffer = Buffer.from(await file.arrayBuffer())

		try {
			const impl = importers[type]

			if (typeof impl.magicOk === 'function') {
				const kind = await fileTypeFromBuffer(buffer) // { ext, mime } or null
				const ok = await impl.magicOk(kind)
				if (!ok) return fail(400, { messageCode: 'importPage.msg.fileTypeNotAllowed' })
			}

			if (typeof impl.run !== 'function') {
				return fail(500, {
					messageCode: 'importPage.msg.importerMissingRun',
					messageVars: { type }
				})
			}

			const result = await impl.run({
				buffer,
				filename: file.name,
				userId: user.userId,
				isPublic
			})

			if (result.messageCode) {
				return {
					messageCode: result.messageCode,
					messageVars: result.messageVars
				}
			}

			const messageCode = result.message
				? null
				: result.skipped
					? result.inserted === 1
						? 'importPage.msg.importedSummaryWithSkipped_one'
						: 'importPage.msg.importedSummaryWithSkipped_other'
					: result.inserted === 1
						? 'importPage.msg.importedSummary_one'
						: 'importPage.msg.importedSummary_other'

			return {
				message: result.message,
				messageCode,
				messageVars: result.message
					? undefined
					: { inserted: result.inserted, skipped: result.skipped || 0 }
			}
		} catch (e) {
			console.error(e)
			return fail(500, {
				message: e.message,
				messageCode: e.message ? null : 'importPage.msg.importFailed'
			})
		}
	}
}
