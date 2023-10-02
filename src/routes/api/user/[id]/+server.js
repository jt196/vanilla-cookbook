import { prisma } from '$lib/server/prisma'
import { auth, LuciaError } from '$lib/server/lucia'
import { validatePassword } from '$lib/utils/security.js'

export const PUT = async ({ request, locals, params }) => {
	const { session, user } = await locals.auth.validateUser()
	const bodyText = await request.text()
	const userData = JSON.parse(bodyText)
	const { id } = params

	if (!session || !user) {
		console.log('No session or user!')
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
					// Reset user password
					await auth.updateKeyPassword('username', userData.username, userData.password)
					// Invalidate all of the user's sessions
					await auth.invalidateAllUserSessions(id)
					// If the admin user has reset their own password, create a new session and set a new session cookie
					if (user.userId === id) {
						try {
							// // Create a new session for the user
							const newSession = await auth.createSession(user.id)
							locals.auth.setSession(newSession)

							return new Response(JSON.stringify({ message: 'Password updated successfully' }), {
								status: 200,
								headers: {
									'Content-Type': 'application/json'
								}
							})
						} catch (e) {
							if (e instanceof LuciaError && e.message === 'AUTH_INVALID_USER_ID') {
								console.error('Invalid user id:', id)
								return new Response(JSON.stringify({ error: 'Invalid user id.' }), {
									status: 400,
									headers: {
										'Content-Type': 'application/json'
									}
								})
							} else {
								console.error('Unexpected error while creating session:', e)
								return new Response(JSON.stringify({ error: 'Unexpected error.' }), {
									status: 500,
									headers: {
										'Content-Type': 'application/json'
									}
								})
							}
						}
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

		if ('isAdmin' in userData) {
			console.log('Is Admin is in user data!')
			// Check if this user is the only admin
			if (existingUser.isAdmin) {
				const adminCount = await prisma.authUser.count({
					where: {
						isAdmin: true
					}
				})

				if (adminCount === 1 && !userData.isAdmin) {
					return new Response(
						JSON.stringify({ error: "The only admin user can't make themselves non-admin." }),
						{
							status: 400,
							headers: {
								'Content-Type': 'application/json'
							}
						}
					)
				}
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

		if (user.isAdmin && !userData.isAdmin) {
			// Invalidate all of the user's sessions
			await auth.invalidateAllUserSessions(id)

			// // Create a new session for the user
			const newSession = await auth.createSession(id)
			locals.auth.setSession(newSession)
			return new Response(
				JSON.stringify({ message: 'Role updated successfully. Please log in again.' }),
				{
					status: 200,
					headers: {
						'Content-Type': 'application/json'
					}
				}
			)
		} else {
			return new Response(JSON.stringify(updatedUser), {
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}
	} catch (error) {
		return new Response(JSON.stringify({ error: `Failed to update user: ${error.message}` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}

export async function DELETE({ params, locals }) {
	const { id } = params
	const { session, user } = await locals.auth.validateUser()

	if (!session || !user) {
		console.log('User Not Authenticated!')
		return new Response('User not authenticated', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	if (!user.isAdmin) {
		return new Response('Unauthorised to delete this user!', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
	try {
		await auth.deleteUser(id)
		return new Response(JSON.stringify('User successfully deleted!.'), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
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
}
