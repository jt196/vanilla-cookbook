import { error } from '@sveltejs/kit'
import { auth } from '$lib/server/lucia'
import { prisma } from '$lib/server/prisma'
import { validatePassword } from '$lib/utils/security.js'
import { requireAuth, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function POST({ request, locals, params }) {
	const user = requireAuth(locals)
	const userId = params.id

	if (user.userId !== userId) {
		throw error(403, 'Unauthorized to change this password')
	}

	const body = await request.json()
	const { oldPass, newPass, newPassConfirm } = body

	const updatingUser = await prisma.authUser.findUnique({
		where: { id: userId }
	})
	const username = updatingUser.username

	if (newPass !== newPassConfirm) {
		return jsonError(400, 'Passwords do not match!')
	}

	try {
		await auth.useKey('username', username, oldPass)
	} catch (err) {
		return jsonError(401, 'Old password is incorrect!')
	}

	const passwordValidation = validatePassword(newPass)
	if (!passwordValidation.isValid) {
		return jsonError(400, passwordValidation.message)
	}

	try {
		await auth.updateKeyPassword('username', username, newPass)
		return jsonSuccess({ message: 'Password updated successfully' })
	} catch (e) {
		console.log('Error: ' + e)
		if (e.name === 'LuciaError') {
			console.log('LuciaError: ' + e.message)
		}
		return jsonError(500, 'An unexpected error occurred.')
	}
}
