import { prisma } from '$lib/server/prisma'
import { auth } from '$lib/server/lucia'
import { validatePassword } from '$lib/utils/security.js'
import { requireAdmin, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { env } from '$env/dynamic/private'

export async function PUT({ request, locals, params }) {
	const user = requireAdmin(locals)

	const bodyText = await request.text()
	const userData = JSON.parse(bodyText)
	const { id } = params

	try {
		const updatingUser = await prisma.authUser.findUnique({
			where: { id }
		})
		if (!updatingUser) {
			return jsonError(404, 'User not found!')
		}

		// Update the user's password
		if (userData.password) {
			const passwordValidation = validatePassword(userData.password, env)
			if (!passwordValidation.isValid) {
				return jsonError(400, passwordValidation.message)
			}

			try {
				await auth.updateKeyPassword('username', userData.username, userData.password)
				await auth.invalidateAllUserSessions(id)

				if (user.userId === id) {
					try {
						const newSession = await auth.createSession({
							userId: user.userId,
							attributes: {}
						})
						locals.auth.setSession(newSession)
						return jsonSuccess({ message: 'Password updated successfully' })
					} catch (e) {
						if (e.name === 'LuciaError' && e.message === 'AUTH_INVALID_USER_ID') {
							console.error('Invalid user id:', id)
							return jsonError(400, 'Invalid user id.')
						}
						console.error('Unexpected error while creating session:', e)
						return jsonError(500, 'Unexpected error.')
					}
				}
			} catch (e) {
				console.log('Error changing password: ' + e)
			}
		}

		// Check if this user is the only admin
		if ('isAdmin' in userData && updatingUser.isAdmin) {
			const adminCount = await prisma.authUser.count({
				where: { isAdmin: true }
			})
			if (adminCount === 1 && !userData.isAdmin) {
				return jsonError(400, "The only admin user can't make themselves non-admin.")
			}
		}

		const updatedUser = await prisma.authUser.update({
			where: { id },
			data: {
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
				displayNutrition:
					'displayNutrition' in userData
						? userData.displayNutrition
						: updatingUser.displayNutrition,
				language: 'language' in userData ? userData.language : updatingUser.language,
				theme: 'theme' in userData ? userData.theme : updatingUser.theme,
			}
		})

		if (user.userId === id) {
			await auth.invalidateAllUserSessions(id)
			const newSession = await auth.createSession({
				userId: id,
				attributes: {}
			})
			locals.auth.setSession(newSession)
			return jsonSuccess({ message: 'Role updated successfully. Please log in again.' })
		} else {
			await auth.invalidateAllUserSessions(id)
			return jsonSuccess(updatedUser)
		}
	} catch (err) {
		if (err.code === 'P2002') {
			if (err.meta?.target?.includes('username')) {
				return jsonError(400, 'Username already taken!')
			} else if (err.meta?.target?.includes('email')) {
				return jsonError(400, 'Email already taken!')
			}
		}
		return jsonError(500, `Failed to update user: ${err.message}`)
	}
}

export async function DELETE({ params, locals }) {
	const user = requireAdmin(locals)
	const { id } = params

	const deletingUser = await prisma.authUser.findUnique({
		where: { id }
	})

	if (!deletingUser) {
		return jsonError(404, 'User not found!')
	}

	if (user.userId === id) {
		return jsonError(400, 'Cannot delete yourself!')
	}

	if (deletingUser.isRoot) {
		return jsonError(403, 'Cannot delete root user!')
	}

	try {
		await auth.deleteUser(id)
		return jsonSuccess({ message: 'User successfully deleted!' })
	} catch (e) {
		console.log('Error: ' + e)
		if (e.name === 'LuciaError') {
			console.log('LuciaError: ' + e.message)
		}
		return jsonError(500, 'An unexpected error occurred.')
	}
}
