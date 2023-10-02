import { prisma } from '$lib/server/prisma'
import { auth } from '$lib/server/lucia'
import { goto } from '$app/navigation'
import { validatePassword } from '$lib/utils/security.js'

export const PUT = async ({ request, locals, params }) => {
	const { session, user } = await locals.auth.validateUser()
	const bodyText = await request.text()
	const userData = JSON.parse(bodyText)
	console.log('🚀 ~ file: +server.js:10 ~ PUT ~ userData:', userData)
	const { id } = params

	if (!session || !user) {
		return new Response('User not authenticated!', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		const existingUser = await prisma.authUser.findUnique({
			where: { id: id }
		})

		if (!existingUser) {
			return new Response('User not found!', {
				status: 404,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		if (!user.isAdmin && existingUser.id !== user.userId) {
			return new Response('Unauthorised to update this user!', {
				status: 401,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		// Update the user's password
		if (userData.password) {
			console.log('Attempting password update!')
			const passwordValidation = validatePassword(userData.password)
			if (passwordValidation.isValid) {
				try {
					console.log('🚀 ~ file: +server.js:52 ~ PUT ~ userData.password:', userData.password)
					// Reset user password
					await auth.updateKeyPassword('username', userData.username, userData.password)
					// Invalidate all of the user's sessions
					await auth.invalidateAllUserSessions(id)
					// If admin user has reset their own password, redirect to the login page
					if (user.userId === id) {
						goto('/login')
					}
				} catch (e) {
					console.log('Error changing password: ' + e)
				}
			} else {
				return new Response(JSON.stringify({ error: passwordValidation.message }), {
					status: 400,
					headers: {
						'Content-Type': 'application/json'
					}
				})
			}
		}
		const updatedUser = await prisma.authUser.update({
			where: { id: id },
			data: {
				name: userData.name || existingUser.name,
				username: userData.username || existingUser.username,
				email: userData.email || existingUser.email,
				about: userData.about || existingUser.about,
				isAdmin: 'isAdmin' in userData ? userData.isAdmin : existingUser.isAdmin
			}
		})

		return new Response(JSON.stringify(updatedUser), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: `Failed to update user: ${error.message}` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
