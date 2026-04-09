import { error, json } from '@sveltejs/kit'
import { auth } from '$lib/server/lucia'
import { prisma } from '$lib/server/prisma'
import { validatePassword } from '$lib/utils/security.js'
import { requireAuth, jsonSuccess } from '$lib/server/authHelpers'
import { env } from '$env/dynamic/private'

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
		return json(
			{ error: 'Passwords do not match!', code: 'settings.msg.passwordMismatch' },
			{ status: 400 }
		)
	}

	try {
		await auth.useKey('username', username, oldPass)
	} catch (err) {
		return json(
			{ error: 'Old password is incorrect!', code: 'settings.msg.passwordIncorrect' },
			{ status: 401 }
		)
	}

	const passwordValidation = validatePassword(newPass, env)
	if (!passwordValidation.isValid) {
		return json(
			{
				error: passwordValidation.message,
				code: passwordValidation.messageCode,
				vars: passwordValidation.messageVars
			},
			{ status: 400 }
		)
	}

	try {
		await auth.updateKeyPassword('username', username, newPass)
		return jsonSuccess({
			message: 'Password updated successfully',
			code: 'settings.msg.passwordUpdated'
		})
	} catch (e) {
		console.log('Error: ' + e)
		if (e.name === 'LuciaError') {
			console.log('LuciaError: ' + e.message)
		}
		return json(
			{ error: 'An unexpected error occurred.', code: 'settings.msg.passwordUpdateFail' },
			{ status: 500 }
		)
	}
}
