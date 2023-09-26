import lucia from 'lucia-auth'
import "lucia-auth/polyfill/node";
import prismaAdapter from '@lucia-auth/adapter-prisma'
import { sveltekit } from 'lucia-auth/middleware'
import { prisma } from '$lib/server/prisma'

const isDev = process.env.VITE_ENV === 'development';

export const auth = lucia({
	adapter: prismaAdapter(prisma),
	env: isDev ? 'DEV' : 'PROD',
	middleware: sveltekit(),
	transformDatabaseUser: (userData) => {
		return {
			userId: userData.id,
			username: userData.username,
			name: userData.name
		}
	},
	sessionCookie: {
		attributes: {
			sameSite: 'strict'
		}
	}
})