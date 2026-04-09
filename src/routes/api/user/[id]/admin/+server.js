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
			return jsonError(404, { error: 'User not found!', code: 'admin.users.msg.userNotFound' })
		}

		// Update the user's password
		if (userData.password) {
			const passwordValidation = validatePassword(userData.password, env)
			if (!passwordValidation.isValid) {
				return jsonError(400, {
					error: passwordValidation.message,
					code: passwordValidation.messageCode,
					vars: passwordValidation.messageVars
				})
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
						return jsonSuccess({
							message: 'Password updated successfully',
							code: 'admin.users.msg.passwordUpdated'
						})
					} catch (e) {
						if (e.name === 'LuciaError' && e.message === 'AUTH_INVALID_USER_ID') {
							console.error('Invalid user id:', id)
							return jsonError(400, {
								error: 'Invalid user id.',
								code: 'admin.users.msg.invalidUserId'
							})
						}
						console.error('Unexpected error while creating session:', e)
						return jsonError(500, {
							error: 'Unexpected error.',
							code: 'admin.users.msg.updateFail'
						})
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
				return jsonError(400, {
					error: "The only admin user can't make themselves non-admin.",
					code: 'admin.users.msg.onlyAdminMustRemain'
				})
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
				theme: 'theme' in userData ? userData.theme : updatingUser.theme
			}
		})

		if (user.userId === id) {
			await auth.invalidateAllUserSessions(id)
			const newSession = await auth.createSession({
				userId: id,
				attributes: {}
			})
			locals.auth.setSession(newSession)
			return jsonSuccess({
				message: 'Role updated successfully. Please log in again.',
				code: 'admin.users.msg.roleUpdated'
			})
		} else {
			await auth.invalidateAllUserSessions(id)
			return jsonSuccess({ ...updatedUser, code: 'admin.users.msg.updated' })
		}
	} catch (err) {
		if (err.code === 'P2002') {
			if (err.meta?.target?.includes('username')) {
				return jsonError(400, {
					error: 'Username already taken!',
					code: 'admin.users.msg.usernameTaken'
				})
			} else if (err.meta?.target?.includes('email')) {
				return jsonError(400, {
					error: 'Email already taken!',
					code: 'admin.users.msg.emailTaken'
				})
			}
		}
		return jsonError(500, {
			error: `Failed to update user: ${err.message}`,
			code: 'admin.users.msg.updateFail'
		})
	}
}

export async function DELETE({ params, locals }) {
	const user = requireAdmin(locals)
	const { id } = params

	const deletingUser = await prisma.authUser.findUnique({
		where: { id }
	})

	if (!deletingUser) {
		return jsonError(404, { error: 'User not found!', code: 'admin.users.msg.userNotFound' })
	}

	if (user.userId === id) {
		return jsonError(400, {
			error: 'Cannot delete yourself!',
			code: 'admin.users.msg.cannotDeleteSelf'
		})
	}

	if (deletingUser.isRoot) {
		return jsonError(403, {
			error: 'Cannot delete root user!',
			code: 'admin.users.msg.cannotDeleteRoot'
		})
	}

	try {
		await auth.deleteUser(id)
		return jsonSuccess({ message: 'User successfully deleted!', code: 'admin.users.msg.deleted' })
	} catch (e) {
		console.log('Error: ' + e)
		if (e.name === 'LuciaError') {
			console.log('LuciaError: ' + e.message)
		}
		return jsonError(500, {
			error: 'An unexpected error occurred.',
			code: 'admin.users.msg.deleteFail'
		})
	}
}
