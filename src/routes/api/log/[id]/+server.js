import { prisma } from '$lib/server/prisma'
import { requireAuth, requireOwnership, jsonSuccess, jsonError } from '$lib/server/authHelpers'

// Handle recipe log updates
export async function PUT({ locals, request, params }) {
	const user = requireAuth(locals)
	const { id } = params

	// Parse the request body to get updated fields
	const body = await request.json()
	const { start, end } = body

	const log = await prisma.RecipeLog.findUnique({
		where: { id }
	})

	requireOwnership(user, log)

	try {
		const updatedLog = await prisma.RecipeLog.update({
			where: { id },
			data: {
				cooked: new Date(start),
				cookedEnd: end ? new Date(end) : undefined
			}
		})
		return jsonSuccess({ updatedLog })
	} catch (err) {
		console.error('Error updating recipe log:', err)
		return jsonError(500, `Failed to update recipe log: ${err.message}`)
	}
}

// Handle recipe log deletion
export async function DELETE({ locals, params }) {
	const user = requireAuth(locals)
	const { id } = params

	const log = await prisma.RecipeLog.findUnique({
		where: { id }
	})

	requireOwnership(user, log)

	try {
		await prisma.RecipeLog.delete({
			where: { id }
		})
		return jsonSuccess({ deleted: id })
	} catch (err) {
		console.error('Error deleting recipe log:', err)
		return jsonError(500, `Failed to delete recipe log: ${err.message}`)
	}
}
