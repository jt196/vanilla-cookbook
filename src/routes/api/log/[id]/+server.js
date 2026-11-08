import { prisma } from '$lib/server/prisma'
import { requireAuth, requireOwnership, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { normalizeString } from '$lib/utils/normalize'

// Handle recipe log updates
/**
 * Update one of the current user's cooking log entries (start, end, note, scale).
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
export async function PUT({ locals, request, params }) {
	const user = requireAuth(locals)
	const { id } = params

	// Parse the request body to get updated fields
	const body = await request.json()
	const { start, end, note, scale } = body

	const log = await prisma.recipeLog.findUnique({
		where: { id }
	})

	requireOwnership(user, log)

	// Build update data - only include fields that were provided
	const updateData = {}
	if (start !== undefined) updateData.cooked = new Date(start)
	if (end !== undefined) updateData.cookedEnd = end ? new Date(end) : null
	if (note !== undefined) updateData.note = normalizeString(note)
	if (scale !== undefined) updateData.scale = scale

	try {
		const updatedLog = await prisma.recipeLog.update({
			where: { id },
			data: updateData
		})
		return jsonSuccess({ updatedLog })
	} catch (err) {
		console.error('Error updating recipe log:', err)
		return jsonError(500, {
			error: `Failed to update recipe log: ${err.message}`,
			code: 'recipe.msg.logUpdateFail'
		})
	}
}

// Handle recipe log deletion
/**
 * Delete one of the current user's cooking log entries.
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
export async function DELETE({ locals, params }) {
	const user = requireAuth(locals)
	const { id } = params

	const log = await prisma.recipeLog.findUnique({
		where: { id }
	})

	requireOwnership(user, log)

	try {
		await prisma.recipeLog.delete({
			where: { id }
		})
		return jsonSuccess({ deleted: id })
	} catch (err) {
		console.error('Error deleting recipe log:', err)
		return jsonError(500, {
			error: `Failed to delete recipe log: ${err.message}`,
			code: 'recipe.msg.logDeleteFail'
		})
	}
}
