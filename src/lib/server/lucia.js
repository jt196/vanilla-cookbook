import { lucia } from 'lucia'
// import 'lucia-auth/polyfill/node'
import { prisma } from '@lucia-auth/adapter-prisma'
import { sveltekit } from 'lucia/middleware'
import { prisma as client } from '$lib/server/prisma'

const isDev = process.env.VITE_ENV === 'development'

export const auth = lucia({
	adapter: prisma(client, {
		user: 'authUser',
		key: 'authKey',
		session: 'authSession'
	}),
	env: isDev ? 'DEV' : 'PROD',
	middleware: sveltekit(),
	getUserAttributes: (userData) => {
		return {
			// userId: userData.id,
			username: userData.username,
			name: userData.name,
			isAdmin: userData.isAdmin,
			publicProfile: userData.publicProfile,
			publicRecipes: userData.publicRecipes,
			units: userData.units,
			skipSmallUnits: userData.skipSmallUnits,
			ingMatch: userData.ingMatch,
			ingOriginal: userData.ingOriginal,
			ingExtra: userData.ingExtra,
			language: userData.language,
			theme: userData.theme
		}
	},
	sessionCookie: {
		attributes: {
			sameSite: isDev ? 'lax' : 'strict',
			secure: isDev ? false : true
		}
	}
})
