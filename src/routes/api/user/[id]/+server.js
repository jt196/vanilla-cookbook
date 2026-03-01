import { error } from '@sveltejs/kit'
import { prisma } from '$lib/server/prisma'
import { requireAuth, getOptionalUser, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function PUT({ request, locals, params }) {
	const user = requireAuth(locals)
	const { id } = params

	if (user.userId !== id) {
		throw error(403, 'Unauthorized to update this user')
	}

	const userData = await request.json()
	const allowedFields = [
		'email',
		'theme',
		'language',
		'units',
		'skipSmallUnits',
		'publicProfile',
		'publicRecipes',
		'ingMatch',
		'ingOriginal',
		'ingExtra',
		'ingSymbol',
		'displayNutrition',
		'showSimilarRecipes',
		'about',
	]

	const updates = Object.fromEntries(
		Object.entries(userData).filter(([key]) => allowedFields.includes(key))
	)

	if (Object.keys(updates).length === 0) {
		return jsonError(400, 'No valid fields to update.')
	}

	const updatedUser = await prisma.authUser.update({
		where: { id },
		data: updates
	})

	return jsonSuccess(updatedUser)
}

export async function GET({ locals, params }) {
	const { id } = params
	const userProfile = await prisma.authUser.findUnique({
		where: { id }
	})

	if (!userProfile) {
		throw error(404, 'User not found')
	}

	const user = getOptionalUser(locals)

	if (!userProfile.publicProfile && !user) {
		throw error(401, 'User not authenticated')
	}

	return jsonSuccess({ userProfile })
}
