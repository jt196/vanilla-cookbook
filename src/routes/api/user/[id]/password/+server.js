import { auth } from '$lib/server/lucia'
import { prisma } from '$lib/server/prisma'
import { validatePassword } from '$lib/utils/security.js'

// eslint-disable-next-line no-unused-vars
export const POST = async ({ request, locals, params }) => {
	const session = await locals.auth.validate()
	const user = session?.user
	const userId = params.id

	if (!session || !user || user.userId !== userId) {
		return new Response(JSON.stringify({ error: 'User not authenticated or wrong user.' }), {
			status: 403,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	const body = await request.json()

	const { oldPass, newPass, newPassConfirm } = body

	const updatingUser = await prisma.authUser.findUnique({
		where: {
			id: userId
		}
	})
	const username = updatingUser.username

	if (newPass !== newPassConfirm) {
		return new Response('Passwords do not match!', {
			status: 400,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		// Verify the old password
		await auth.useKey('username', username, oldPass)
	} catch (err) {
		return new Response(JSON.stringify({ error: 'Old password is incorrect!' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
	const passwordValidation = validatePassword(newPass)
	if (passwordValidation.isValid) {
		try {
			// Update the user's password
			await auth.updateKeyPassword('username', username, newPass)

			// Return success response - keep user logged in with current session
			return new Response(JSON.stringify({ message: 'Password updated successfully' }), {
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		} catch (e) {
			console.log('Error: ' + e)
			if (e.name === 'LuciaError') {
				console.log('LuciaError: ' + e.message)
			}
			return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}
	} else {
		return new Response(JSON.stringify({ error: passwordValidation.message }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
