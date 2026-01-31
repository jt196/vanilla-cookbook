/**
 * Authentication helper utilities for API routes.
 *
 * Provides standardized authentication checks and response helpers
 * to reduce boilerplate across API endpoints.
 *
 * @module authHelpers
 */

import { error, json } from '@sveltejs/kit'

/**
 * Requires an authenticated user. Throws 401 if not logged in.
 *
 * @param {import('@sveltejs/kit').RequestEvent['locals']} locals - The request locals object
 * @returns {{ userId: string, username: string, isAdmin: boolean, [key: string]: any }} The authenticated user
 * @throws {import('@sveltejs/kit').HttpError} 401 if not authenticated
 *
 * @example
 * export async function GET({ locals }) {
 *   const user = requireAuth(locals)
 *   // user is guaranteed to exist here
 *   return jsonSuccess({ userId: user.userId })
 * }
 */
export function requireAuth(locals) {
	const user = locals.user
	if (!user) {
		throw error(401, 'Authentication required')
	}
	return user
}

/**
 * Requires an authenticated admin user. Throws 401 if not logged in, 403 if not admin.
 *
 * @param {import('@sveltejs/kit').RequestEvent['locals']} locals - The request locals object
 * @returns {{ userId: string, username: string, isAdmin: boolean, [key: string]: any }} The authenticated admin user
 * @throws {import('@sveltejs/kit').HttpError} 401 if not authenticated, 403 if not admin
 *
 * @example
 * export async function DELETE({ locals }) {
 *   const user = requireAdmin(locals)
 *   // user.isAdmin is guaranteed true here
 *   await prisma.authUser.delete({ where: { id: params.id } })
 * }
 */
export function requireAdmin(locals) {
	const user = requireAuth(locals)
	if (!user.isAdmin) {
		throw error(403, 'Admin access required')
	}
	return user
}

/**
 * Requires that the user owns the resource. Throws 403 if not owner.
 *
 * The resource must have a `userId` property that matches the user's `userId`.
 *
 * @param {{ userId: string, isAdmin?: boolean }} user - The authenticated user
 * @param {{ userId: string } | null | undefined} resource - The resource to check ownership of
 * @param {{ allowAdmin?: boolean }} [options={}] - Options for ownership check
 * @param {boolean} [options.allowAdmin=false] - If true, admins can access any resource
 * @throws {import('@sveltejs/kit').HttpError} 404 if resource is null/undefined, 403 if not owner
 *
 * @example
 * export async function PUT({ locals, params }) {
 *   const user = requireAuth(locals)
 *   const recipe = await prisma.recipe.findUnique({ where: { uid: params.id } })
 *   requireOwnership(user, recipe)
 *   // user owns this recipe
 * }
 *
 * @example
 * // With admin override
 * requireOwnership(user, recipe, { allowAdmin: true })
 */
export function requireOwnership(user, resource, options = {}) {
	if (!resource) {
		throw error(404, 'Resource not found')
	}

	const { allowAdmin = false } = options

	// Admin bypass if enabled
	if (allowAdmin && user.isAdmin) {
		return
	}

	if (resource.userId !== user.userId) {
		throw error(403, 'Access denied: you do not own this resource')
	}
}

/**
 * Checks access to a resource that may be public or private.
 *
 * Allows access if:
 * - Resource has `is_public: true` or owner has `publicRecipes: true`
 * - User is authenticated and owns the resource
 * - User is admin (if allowAdmin option is true)
 *
 * @param {import('@sveltejs/kit').RequestEvent['locals']} locals - The request locals object
 * @param {{ userId: string, is_public?: boolean } | null | undefined} resource - The resource to check
 * @param {{ allowAdmin?: boolean, checkOwnerPublic?: boolean }} [options={}] - Options
 * @param {boolean} [options.allowAdmin=false] - If true, admins can access any resource
 * @param {boolean} [options.checkOwnerPublic=false] - If true, also check owner's publicRecipes setting
 * @throws {import('@sveltejs/kit').HttpError} 404 if resource is null/undefined, 403 if private and not owner
 *
 * @example
 * export async function GET({ locals, params }) {
 *   const recipe = await prisma.recipe.findUnique({
 *     where: { uid: params.id },
 *     include: { user: true }
 *   })
 *   requireAccessOrPublic(locals, recipe)
 *   return jsonSuccess({ recipe })
 * }
 */
export function requireAccessOrPublic(locals, resource, options = {}) {
	if (!resource) {
		throw error(404, 'Resource not found')
	}

	const { allowAdmin = false, checkOwnerPublic = false } = options
	const user = locals.user

	// Public resource - allow access
	if (resource.is_public) {
		return
	}

	// Check owner's publicRecipes setting if requested
	if (checkOwnerPublic && resource.user?.publicRecipes) {
		return
	}

	// Not logged in and not public - deny
	if (!user) {
		throw error(403, 'Access denied: this resource is private')
	}

	// Admin bypass if enabled
	if (allowAdmin && user.isAdmin) {
		return
	}

	// Owner check
	if (resource.userId !== user.userId) {
		throw error(403, 'Access denied: this resource is private')
	}
}

/**
 * Returns a standardized JSON success response.
 *
 * @param {any} data - The data to return
 * @param {number} [status=200] - HTTP status code
 * @returns {Response} JSON response
 *
 * @example
 * return jsonSuccess({ recipe: updatedRecipe })
 * return jsonSuccess({ created: newItem }, 201)
 */
export function jsonSuccess(data, status = 200) {
	return json(data, { status })
}

/**
 * Returns a standardized JSON error response.
 *
 * Note: For most cases, prefer using SvelteKit's `error()` function
 * which integrates with the framework's error handling. Use this only
 * when you need to return a Response object directly.
 *
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @returns {Response} JSON error response
 *
 * @example
 * return jsonError(400, 'Invalid input')
 * return jsonError(404, 'Recipe not found')
 */
export function jsonError(status, message) {
	return json({ error: message }, { status })
}

/**
 * Gets the authenticated user if available, otherwise returns null.
 * Unlike requireAuth, this does not throw an error.
 *
 * @param {import('@sveltejs/kit').RequestEvent['locals']} locals - The request locals object
 * @returns {{ userId: string, username: string, isAdmin: boolean, [key: string]: any } | null} The user or null
 *
 * @example
 * export async function GET({ locals }) {
 *   const user = getOptionalUser(locals)
 *   if (user) {
 *     // logged in user
 *   } else {
 *     // anonymous user
 *   }
 * }
 */
export function getOptionalUser(locals) {
	return locals.user ?? null
}
