/**
 * Auth utilities for page/layout `load()` functions.
 *
 * Use this module for redirects in UI routes. For API routes (JSON responses),
 * use `$lib/server/authHelpers.js` instead.
 *
 * @module authPage
 */

import { error, redirect } from '@sveltejs/kit'

/**
 * Enforces authentication for page/layout loads.
 * Redirects to login if not authenticated.
 *
 * @param {import('@sveltejs/kit').RequestEvent['locals']} locals
 * @param {string} [redirectTo='/login']
 * @returns {{ userId: string, username: string, isAdmin: boolean, [key: string]: any }}
 */
export function requireUser(locals, redirectTo = '/login') {
	const user = locals.user
	if (!user) {
		throw redirect(302, redirectTo)
	}
	return user
}

/**
 * Enforces that the authenticated user matches the requested userId.
 * Redirects to home if not matched.
 *
 * @param {{ userId: string }} user
 * @param {string} requestedUserId
 * @param {string} [redirectTo='/']
 */
export function requireUserMatch(user, requestedUserId, redirectTo = '/') {
	if (!user || user.userId !== requestedUserId) {
		throw redirect(302, redirectTo)
	}
}

/**
 * Enforces admin access for page/layout loads.
 * Redirects to login if not authenticated, 403 if not admin.
 *
 * @param {import('@sveltejs/kit').RequestEvent['locals']} locals
 * @returns {{ userId: string, username: string, isAdmin: boolean, [key: string]: any }}
 */
export function requireAdminUser(locals) {
	const user = requireUser(locals)
	if (!user.isAdmin) {
		throw error(403, 'Forbidden')
	}
	return user
}
