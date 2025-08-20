// src/lib/server/lucia.js
import { lucia } from 'lucia'
import { prisma as prismaAdapter } from '@lucia-auth/adapter-prisma'
import { sveltekit } from 'lucia/middleware'
import { prisma as client } from '$lib/server/prisma'
import { dev } from '$app/environment'

export const auth = lucia({
	adapter: prismaAdapter(client, {
		user: 'authUser',
		key: 'authKey',
		session: 'authSession'
	}),
	env: dev ? 'DEV' : 'PROD',
	middleware: sveltekit(),
	getUserAttributes: (u) => ({
		username: u.username,
		name: u.name,
		isAdmin: u.isAdmin,
		publicProfile: u.publicProfile,
		publicRecipes: u.publicRecipes,
		units: u.units,
		skipSmallUnits: u.skipSmallUnits,
		ingMatch: u.ingMatch,
		ingOriginal: u.ingOriginal,
		ingExtra: u.ingExtra,
		useCats: u.useCats,
		ingSymbol: u.ingSymbol,
		language: u.language,
		theme: u.theme
	}),
	sessionCookie: {
		attributes: {
			sameSite: 'lax',
			secure: !dev,
			path: '/'
		}
	}
})
