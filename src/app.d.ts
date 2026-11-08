import type { PrismaClient } from '@prisma/client'

declare global {
	namespace App {
		// interface Error {}

		/** Set on every request by src/hooks.server.js */
		interface Locals {
			auth: import('lucia').AuthRequest
			session: import('lucia').Session | null
			/** The logged-in user (Lucia user: `userId` plus the attributes below), or null */
			user: import('lucia').User | null
			clientIp: string
			limiter: ReturnType<typeof import('$lib/server/rateLimit').makeLimiter>
			/** Site settings, OAuth providers and AI / semantic search config */
			site: ReturnType<typeof import('$lib/server/siteConfig').resolveSiteConfig>
		}
		// interface PageData {}
		// interface Platform {}
	}
	var __prisma: PrismaClient

	// Lucia v2 type registration: user attributes match getUserAttributes in $lib/server/lucia
	namespace Lucia {
		type Auth = import('$lib/server/lucia').Auth
		type DatabaseUserAttributes = {
			username: string
			isAdmin: boolean
			isRoot?: boolean
			email?: string | null
			about?: string | null
			publicProfile: boolean
			publicRecipes: boolean
			units: string
			skipSmallUnits: boolean
			ingMatch: boolean
			ingOriginal: boolean
			ingExtra: boolean
			displayNutrition: boolean
			showSimilarRecipes: boolean
			showNotesDescription: boolean
			ingSymbol: boolean
			language: string
			theme: string
		}
		type DatabaseSessionAttributes = Record<string, never>
	}
}

export {}
