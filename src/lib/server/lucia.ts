import lucia from "lucia-auth"
import prismaAdapter from "@lucia-auth/adapter-prisma"
import { dev } from "$app/environment"
import { prisma } from "$lib/server/prisma"

export const auth = lucia({
	adapter: prismaAdapter(prisma),
	env: dev ? "DEV" : "PROD",
	transformUserData: (userData) => {
		return {
			userId: userData.id,
			username: userData.username,
			name: userData.name,
		}
	},
})

export type Auth = typeof auth
