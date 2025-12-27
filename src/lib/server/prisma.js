import PrismaClientPkg from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import { env } from "$env/dynamic/private"

const { PrismaClient } = PrismaClientPkg

// Create LibSQL adapter for Prisma 7
const libsqlAdapter = new PrismaLibSql({
	url: process.env.DATABASE_URL || "file:./prisma/db/dev.sqlite"
})

// Initialize Prisma with adapter
const prisma = global.__prisma || new PrismaClient({ adapter: libsqlAdapter })

if (env.NODE_ENV === "development") {
	global.__prisma = prisma
}

export { prisma }
