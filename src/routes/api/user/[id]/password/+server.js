import { auth, LuciaError } from '$lib/server/lucia'
import { prisma } from '$lib/server/prisma'
import { validatePassword } from '$lib/utils/security.js'

// eslint-disable-next-line no-unused-vars
export const POST = async ({ request, locals, params }) => {
	const body = await request.json()
	const { oldPass, newPass, newPassConfirm } = body
	const userId = params.id
	const user = await prisma.authUser.findUnique({
		where: {
			id: userId
		}
	})

	const username = user.username

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
		console.log('Checking the old password!')
		await auth.useKey('username', username, oldPass)
	} catch (err) {
		console.log('🚀 ~ file: +server.js:24 ~ POST ~ err:', err)
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

			// Invalidate all of the user's sessions
			await auth.invalidateAllUserSessions(user.userId)

			// Now, log in again using the new password:
			const key = await auth.useKey('username', username, newPass)
			const newSession = await auth.createSession(key.userId)

			// Set the new session for the user
			locals.auth.setSession(newSession)
			// For the successful update
			return new Response(JSON.stringify({ message: 'Password updated successfully' }), {
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			})

			// For the catch block or error scenario
		} catch (e) {
			console.log('Error: ' + e)
			if (e instanceof LuciaError) {
				console.log('LuciaError: ' + e)
			}
			return new Response(JSON.stringify({ error: 'An unexpected error occurred.' }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}
	} else {
		return new Response(JSON.stringify({ error: 'Password not valid!' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
