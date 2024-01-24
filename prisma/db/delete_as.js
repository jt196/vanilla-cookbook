import PrismaClientPkg from '@prisma/client'

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

async function deleteAndDisconnect() {
	await prismaC.authSession.deleteMany()
	await prismaC.$disconnect()
}

deleteAndDisconnect()

// await prismaC.authSession.delete({
//   where: {
//     id: "6lZxnZROnBWOqvNKIs0vIzrKtQ3yD7dtdMMbKLaK"
//   }
// });
