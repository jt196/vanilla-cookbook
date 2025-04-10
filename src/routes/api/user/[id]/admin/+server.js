import { prisma } from '$lib/server/prisma'
import { auth } from '$lib/server/lucia'
import { validatePassword } from '$lib/utils/security.js'

export const PUT = async ({ request, locals, params }) => {
	const session = await locals.auth.validate()
	const user = session?.user

	if (!session || !user || !user.isAdmin) {
		return new Response(JSON.stringify({ error: 'Admin only!' }), {
			status: 403,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	const bodyText = await request.text()
	const userData = JSON.parse(bodyText)
	const { id } = params

	try {
		const updatingUser = await prisma.authUser.findUnique({
			where: { id: id }
		})
		if (!updatingUser) {
			console.log('User not found!')
			return new Response('User not found!', {
				status: 404,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		if (!user.isAdmin && updatingUser.id !== user.userId) {
			console.log('Unauthorised to update this user!')
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
					console.log('1st invalidate session: ', userData)
					console.log('1st invalidate session: ', user)
					// Invalidate all of the user's sessions
					await auth.invalidateAllUserSessions(id)
					// If the admin user has reset their own password, create a new session and set a new session cookie
					if (user.userId === id) {
						try {
							// // Create a new session for the user
							// const newSession = await auth.createSession(user.id)
							const newSession = await auth.createSession({
								userId: user.id,
								attributes: {}
							})
							locals.auth.setSession(newSession)

							return new Response(JSON.stringify({ message: 'Password updated successfully' }), {
								status: 200,
								headers: {
									'Content-Type': 'application/json'
								}
							})
						} catch (e) {
							if (e.name === 'LuciaError' && e.message === 'AUTH_INVALID_USER_ID') {
								console.log('LuciaError: ' + e.message)
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

		// Check if this user is the only admin
		if ('isAdmin' in userData) {
			if (updatingUser.isAdmin) {
				const adminCount = await prisma.authUser.count({
					where: {
						isAdmin: true
					}
				})
				// Return error if they are the only admin
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
		// Updating the user object with a fallback if the value doesn't exist
		// Note the different format for boolean values
		const updatedUser = await prisma.authUser.update({
			where: { id: id },
			data: {
				name: userData.name || updatingUser.name,
				email: userData.email || updatingUser.email,
				about: userData.about || updatingUser.about,
				units: userData.units || updatingUser.units,
				skipSmallUnits:
					'skipSmallUnits' in userData ? userData.skipSmallUnits : updatingUser.skipSmallUnits,
				publicProfile:
					'publicProfile' in userData ? userData.publicProfile : updatingUser.publicProfile,
				publicRecipes:
					'publicRecipes' in userData ? userData.publicRecipes : updatingUser.publicRecipes,
				isAdmin: 'isAdmin' in userData ? userData.isAdmin : updatingUser.isAdmin,
				ingMatch: 'ingMatch' in userData ? userData.ingMatch : updatingUser.ingMatch,
				ingOriginal: 'ingOriginal' in userData ? userData.ingOriginal : updatingUser.ingOriginal,
				ingExtra: 'ingExtra' in userData ? userData.ingExtra : updatingUser.ingExtra,
				ingSymbol: 'ingSymbol' in userData ? userData.ingSymbol : updatingUser.ingSymbol,
				language: 'language' in userData ? userData.language : updatingUser.language,
				theme: 'theme' in userData ? userData.theme : updatingUser.theme,
				useCats: 'useCats' in userData ? userData.useCats : updatingUser.useCats
			}
		})
		// if the user being edited is the current user, update the session
		if (user.isAdmin && user.userId === id) {
			// Invalidate all of the user's sessions
			console.log('2nd invalidate session: ', userData)
			console.log('2nd invalidate session: ', user)
			await auth.invalidateAllUserSessions(id)

			// // Create a new session for the user
			const newSession = await auth.createSession({
				userId: id,
				attributes: {}
			})
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
			console.log('3rd invalidate session (current user): ', user)
			console.log('3rd invalidate session (editing user): ', userData)
			// Invalidate all of the user's sessions
			await auth.invalidateAllUserSessions(id)
			return new Response(JSON.stringify(updatedUser), {
				status: 200,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}
	} catch (error) {
		// console.error('Error updating user:', error)
		// Check for duplicate entry errors from Prisma
		if (error.code === 'P2002') {
			if (error.meta?.target?.includes('username')) {
				// console.error('Duplicate username error:', error)
				return new Response(JSON.stringify({ error: 'Username already taken!' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				})
			} else if (error.meta?.target?.includes('email')) {
				// console.error('Duplicate email error:', error)
				return new Response(JSON.stringify({ error: 'Email already taken!' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' }
				})
			}
		}
		return new Response(JSON.stringify({ error: `Failed to update user: ${error.message}` }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		})
	}
}

export async function DELETE({ params, locals }) {
	const { id } = params

	const session = await locals.auth.validate()
	const user = session?.user

	if (!session || !user || !user.isAdmin) {
		return new Response(JSON.stringify({ error: 'Admin only!' }), {
			status: 403,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	const deletingUser = await prisma.authUser.findUnique({
		where: { id: id }
	})

	// Error if user tries to delete themself
	if (user.userId === id) {
		console.log('Cannot delete yourself!')
		return new Response('Cannot delete yourself!', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	// Error if user is not admin
	if (!user.isAdmin) {
		console.log('Unauthorised to delete this user!')
		return new Response('Unauthorised to delete this user!', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	// Error if user is root
	if (deletingUser.isRoot) {
		console.log('Unauthorised to delete root user!')
		return new Response('Cannot delete root user!', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
	try {
		console.log('Attempting to delete user!')
		await auth.deleteUser(id)
		return new Response(JSON.stringify('User successfully deleted!.'), {
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
}
