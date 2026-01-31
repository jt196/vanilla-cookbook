import { prisma } from '$lib/server/prisma'
import { requireAuth, requireOwnership, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function POST({ locals, params, request }) {
	const user = requireAuth(locals)
	const { uid } = params

	let note = null
	let scale = 1
	try {
		const body = await request.json()
		note = body.note || null
		scale = body.scale ?? 1
	} catch {
		// No body or invalid JSON - defaults remain
	}

	try {
		const cookedTime = new Date()
		const cookedEndTime = new Date(cookedTime.getTime() + 180 * 60 * 1000)
		const recipeLog = await prisma.RecipeLog.create({
			data: {
				recipeUid: uid,
				userId: user.userId,
				cooked: cookedTime,
				cookedEnd: cookedEndTime,
				note,
				scale
			}
		})
		return jsonSuccess({ recipeLog })
	} catch (err) {
		console.log('Error: ' + err)
		return jsonError(500, `Failed to add recipe log: ${err.message}`)
	}
}

export async function GET({ params, locals }) {
	const user = requireAuth(locals)
	const { uid } = params

	try {
		const recipe = await prisma.recipe.findUnique({
			where: { uid }
		})

		requireOwnership(user, recipe)

		const recipeLogs = await prisma.RecipeLog.findMany({
			where: { recipeUid: uid },
			orderBy: { cooked: 'desc' }
		})

		return jsonSuccess(recipeLogs)
	} catch (err) {
		if (err.status) throw err
		return jsonError(500, `Failed to fetch recipe logs: ${err.message}`)
	}
}
