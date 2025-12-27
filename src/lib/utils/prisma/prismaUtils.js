// adminUtils.js
import PrismaClientPkg from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { lucia } from 'lucia'
import { sveltekit } from 'lucia/middleware'
import { prisma } from '@lucia-auth/adapter-prisma'
import 'lucia/polyfill/node'

// Initialize Prisma
const PrismaClient = PrismaClientPkg.PrismaClient
const adapter = new PrismaLibSql({
	url: process.env.DATABASE_URL || 'file:./prisma/db/dev.sqlite'
})
const prismaC = new PrismaClient({
	adapter,
	errorFormat: 'pretty'
})

// Setup Lucia with separate client instance
const luciaAdapter = new PrismaLibSql({
	url: process.env.DATABASE_URL || 'file:./prisma/db/dev.sqlite'
})
const luciaClient = new PrismaClient({ adapter: luciaAdapter })

export const auth = lucia({
	adapter: prisma(luciaClient, {
		user: 'authUser',
		key: 'authKey',
		session: 'authSession'
	}),
	env: 'DEV',
	middleware: sveltekit()
})

/**
 * Deletes all auth sessions and disconnects from the database.
 *
 * This function is used by the updatePassword and deleteUser functions.
 *
 * @returns {Promise<void>} - A promise that resolves when all sessions have been
 * deleted and the database has been disconnected.
 */
export async function deleteAndDisconnect() {
	await prismaC.authSession.deleteMany()
	await prismaC.$disconnect()
}

/**
 * Updates a user's password in Lucia
 *
 * @param {string} username - The username of the user whose password is to be updated.
 * @param {string} newPassword - The new password to set for the user.
 * @returns {Promise<void>} - A promise that resolves when the password has been updated.
 */

export async function updatePassword(username, newPassword) {
	await auth.updateKeyPassword('username', username, newPassword)
}

/**
 * Deletes a user from the authUser table, as well as all associated sessions and auth keys.
 * @param {string} userId The ID of the user to delete.
 * @returns {Promise<PrismaClientPkg.authUser>} The deleted user.
 * @throws {Error} If there is an error deleting the user.
 */
export async function deleteUser(userId) {
	try {
		// Delete all sessions for the user
		await prismaC.authSession.deleteMany({
			where: { user_id: userId }
		})

		// Delete all auth keys for the user
		await prismaC.authKey.deleteMany({
			where: { user_id: userId }
		})

		// Now delete the user
		const deletedUser = await prismaC.authUser.delete({
			where: { id: userId }
		})

		return deletedUser
	} catch (error) {
		throw new Error(`Error deleting user: ${error.message}`)
	}
}
