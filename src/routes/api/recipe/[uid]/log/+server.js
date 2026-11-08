import { prisma } from '$lib/server/prisma'
import { requireAuth, requireOwnership, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { normalizeString, normalizeNumber } from '$lib/utils/normalize'

export async function POST({ locals, params, request }) {
	const user = requireAuth(locals)
	const { uid } = params

	let note = null
	let scale = 1
	try {
		const body = await request.json()
		note = normalizeString(body.note)
		const { value: parsedScale } = normalizeNumber(body.scale)
		scale = parsedScale ?? 1
	} catch {
		// No body or invalid JSON - defaults remain
	}

	try {
		const recipe = await prisma.recipe.findUnique({
			where: { uid },
			select: { userId: true, is_public: true }
		})
		if (!recipe) {
			return jsonError(404, { error: 'Recipe not found', code: 'recipe.msg.notFound' })
		}
		if (!recipe.is_public && recipe.userId !== user.userId && !user.isAdmin) {
			return jsonError(403, {
				error: 'Access denied: this recipe is private',
				code: 'recipe.msg.privateAccessDenied'
			})
		}

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
		console.error('Error adding recipe log:', err)
		return jsonError(500, {
			error: `Failed to add recipe log: ${err.message}`,
			code: 'recipe.msg.cookedFail'
		})
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
		return jsonError(500, {
			error: `Failed to fetch recipe logs: ${err.message}`,
			code: 'recipe.msg.logLoadFail'
		})
	}
}
