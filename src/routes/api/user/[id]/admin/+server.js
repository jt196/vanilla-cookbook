import { prisma } from '$lib/server/prisma'
import { auth } from '$lib/server/lucia'
import { validatePassword } from '$lib/utils/security.js'
import { requireAdmin, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { env } from '$env/dynamic/private'
import { isValidThemePreference } from '$lib/utils/theme'

// Fields an admin may change; anything else in the body is ignored.
const BOOLEAN_FIELDS = [
	'skipSmallUnits',
	'publicProfile',
	'publicRecipes',
	'isAdmin',
	'ingMatch',
	'ingOriginal',
	'ingExtra',
	'ingSymbol',
	'displayNutrition'
]

/** Build the Prisma update payload from the request body, keeping existing values by default. */
function buildUpdate(userData) {
	const data = {}
	// Empty strings keep the current value for these, matching the admin form's behaviour
	for (const key of ['email', 'about', 'units']) if (userData[key]) data[key] = userData[key]
	for (const key of [...BOOLEAN_FIELDS, 'language']) if (key in userData) data[key] = userData[key]
	if (isValidThemePreference(userData.theme)) data.theme = userData.theme
	return data
}

/** Replace the current session after the admin changes their own account. */
async function refreshOwnSession(locals, userId) {
	await auth.invalidateAllUserSessions(userId)
	locals.auth.setSession(await auth.createSession({ userId, attributes: {} }))
}

/**
 * Admin: update a user (preferences, admin role, optional password reset) and end their
 * sessions.
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
export async function PUT({ request, locals, params }) {
	const user = requireAdmin(locals)
	const userData = await request.json()
	const { id } = params
	const isSelf = user.userId === id

	try {
		const updatingUser = await prisma.authUser.findUnique({ where: { id } })
		if (!updatingUser) {
			return jsonError(404, { error: 'User not found!', code: 'admin.users.msg.userNotFound' })
		}

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
				await auth.updateKeyPassword('username', updatingUser.username, userData.password)
			} catch (e) {
				// e.g. an OAuth/OIDC-only account has no password key to update
				console.error('Error changing password:', e)
				return jsonError(400, {
					error: `Failed to update password: ${e.message}`,
					code: 'admin.users.msg.updateFail'
				})
			}

			if (isSelf) {
				await refreshOwnSession(locals, id)
				return jsonSuccess({
					message: 'Password updated successfully',
					code: 'admin.users.msg.passwordUpdated'
				})
			}
			await auth.invalidateAllUserSessions(id)
		}

		if ('isAdmin' in userData && !userData.isAdmin && updatingUser.isAdmin) {
			if (updatingUser.isRoot) {
				return jsonError(403, {
					error: 'The root user must remain an admin.',
					code: 'admin.users.msg.rootMustRemainAdmin'
				})
			}
			if ((await prisma.authUser.count({ where: { isAdmin: true } })) === 1) {
				return jsonError(400, {
					error: "The only admin user can't make themselves non-admin.",
					code: 'admin.users.msg.onlyAdminMustRemain'
				})
			}
		}

		const updatedUser = await prisma.authUser.update({ where: { id }, data: buildUpdate(userData) })

		if (isSelf) {
			await refreshOwnSession(locals, id)
			return jsonSuccess({
				message: 'Role updated successfully. Please log in again.',
				code: 'admin.users.msg.roleUpdated'
			})
		}
		await auth.invalidateAllUserSessions(id)
		return jsonSuccess({ ...updatedUser, code: 'admin.users.msg.updated' })
	} catch (err) {
		if (err.code === 'P2002') {
			const field = err.meta?.target?.includes('username') ? 'username' : 'email'
			return jsonError(400, {
				error: `${field === 'username' ? 'Username' : 'Email'} already taken!`,
				code: `admin.users.msg.${field}Taken`
			})
		}
		return jsonError(500, {
			error: `Failed to update user: ${err.message}`,
			code: 'admin.users.msg.updateFail'
		})
	}
}

/**
 * Admin: delete a user (not yourself and not the root user).
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
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
		console.error('Error deleting user:', e)
		return jsonError(500, {
			error: 'An unexpected error occurred.',
			code: 'admin.users.msg.deleteFail'
		})
	}
}
