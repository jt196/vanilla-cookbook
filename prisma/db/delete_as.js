import PrismaClientPkg from '@prisma/client'
import { lucia } from 'lucia'
import { sveltekit } from 'lucia/middleware'
import { prisma } from '@lucia-auth/adapter-prisma'
import 'lucia/polyfill/node'

// // Prisma doesn't support ES Modules so we have to do this
const PrismaClient = PrismaClientPkg.PrismaClient
// Different name of prismaC as the auth is importing prisma from the adapter
const prismaC = new PrismaClient({
	errorFormat: 'pretty',
	datasources: {
		db: {
			// url: 'file:./db/dev.sqlite?connection_limit=1'
			url: 'file:./db/dev.sqlite'
			// connectionTimeout: 60000 // Increase the timeout to 60 seconds (adjust as needed)
		}
	}
})

// Have to invoke the auth module here as it's outside the project directory.
export const auth = lucia({
	adapter: prisma(new PrismaClient(), {
		user: 'authUser',
		key: 'authKey',
		session: 'authSession'
	}),
	env: 'DEV',
	middleware: sveltekit()
})

// Delete a specific session
async function deleteSession(id) {
	await prismaC.authSession.delete({
		where: {
			id: id
		}
	})
}

// Delete all auth sessions then disconnect from the database
async function deleteAndDisconnect() {
	await prismaC.authSession.deleteMany()
	await prismaC.$disconnect()
}

// Reset the user password in case of lock out
async function updatePassword() {
	await auth.updateKeyPassword('username', 'jt196', 'homersdad')
}

deleteAndDisconnect()

// updatePassword();
