import { error } from '@sveltejs/kit'
import { prisma } from '$lib/server/prisma'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function POST({ request, locals, params }) {
	const user = requireAuth(locals)
	const { id } = params

	if (user.userId !== id) {
		throw error(403, 'Unauthorized to update this user')
	}

	let isPublic = false
	try {
		const payload = await request.json().catch(() => ({}))
		if (typeof payload?.isPublic === 'boolean') {
			isPublic = payload.isPublic
		}
	} catch {
		// Default to private when no/invalid payload is provided.
	}

	try {
		const where = isPublic
			? {
					userId: id,
					OR: [{ is_public: false }, { is_public: null }]
				}
			: { userId: id, is_public: true }

		const result = await prisma.recipe.updateMany({
			where,
			data: { is_public: isPublic }
		})

		return jsonSuccess({
			message: `Set ${result.count} recipe${result.count === 1 ? '' : 's'} to ${
				isPublic ? 'public' : 'private'
			}.`,
			code:
				result.count === 1
					? isPublic
						? 'settings.msg.allPublic_one'
						: 'settings.msg.allPrivate_one'
					: isPublic
						? 'settings.msg.allPublic_other'
						: 'settings.msg.allPrivate_other',
			vars: { count: result.count },
			updatedCount: result.count
		})
	} catch (err) {
		return jsonError(500, {
			error: `Failed to update recipe visibility: ${err.message}`,
			code: 'settings.msg.visibilityFail'
		})
	}
}
