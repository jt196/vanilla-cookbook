import { describe, it, expect } from 'vitest'
import {
	requireAuth,
	requireAdmin,
	requireOwnership,
	requireAccessOrPublic,
	jsonSuccess,
	jsonError,
	getOptionalUser
} from '$lib/server/authHelpers'

describe('authHelpers', () => {
	describe('requireAuth', () => {
		it('returns user when authenticated', () => {
			const locals = { user: { userId: 'user123', username: 'testuser', isAdmin: false } }
			const user = requireAuth(locals)
			expect(user).toEqual(locals.user)
		})

		it('throws 401 when user is null', () => {
			const locals = { user: null }
			expect(() => requireAuth(locals)).toThrow()
			try {
				requireAuth(locals)
			} catch (e) {
				expect(e.status).toBe(401)
				expect(e.body.message).toBe('Authentication required')
			}
		})

		it('throws 401 when user is undefined', () => {
			const locals = {}
			expect(() => requireAuth(locals)).toThrow()
			try {
				requireAuth(locals)
			} catch (e) {
				expect(e.status).toBe(401)
			}
		})
	})

	describe('requireAdmin', () => {
		it('returns user when admin', () => {
			const locals = { user: { userId: 'admin1', username: 'admin', isAdmin: true } }
			const user = requireAdmin(locals)
			expect(user).toEqual(locals.user)
			expect(user.isAdmin).toBe(true)
		})

		it('throws 401 when not authenticated', () => {
			const locals = { user: null }
			expect(() => requireAdmin(locals)).toThrow()
			try {
				requireAdmin(locals)
			} catch (e) {
				expect(e.status).toBe(401)
			}
		})

		it('throws 403 when authenticated but not admin', () => {
			const locals = { user: { userId: 'user1', username: 'user', isAdmin: false } }
			expect(() => requireAdmin(locals)).toThrow()
			try {
				requireAdmin(locals)
			} catch (e) {
				expect(e.status).toBe(403)
				expect(e.body.message).toBe('Admin access required')
			}
		})
	})

	describe('requireOwnership', () => {
		const user = { userId: 'user123', isAdmin: false }
		const adminUser = { userId: 'admin1', isAdmin: true }

		it('passes when user owns resource', () => {
			const resource = { userId: 'user123', name: 'My Recipe' }
			expect(() => requireOwnership(user, resource)).not.toThrow()
		})

		it('throws 404 when resource is null', () => {
			expect(() => requireOwnership(user, null)).toThrow()
			try {
				requireOwnership(user, null)
			} catch (e) {
				expect(e.status).toBe(404)
				expect(e.body.message).toBe('Resource not found')
			}
		})

		it('throws 404 when resource is undefined', () => {
			expect(() => requireOwnership(user, undefined)).toThrow()
			try {
				requireOwnership(user, undefined)
			} catch (e) {
				expect(e.status).toBe(404)
			}
		})

		it('throws 403 when user does not own resource', () => {
			const resource = { userId: 'otherUser', name: 'Their Recipe' }
			expect(() => requireOwnership(user, resource)).toThrow()
			try {
				requireOwnership(user, resource)
			} catch (e) {
				expect(e.status).toBe(403)
				expect(e.body.message).toBe('Access denied: you do not own this resource')
			}
		})

		it('allows admin access when allowAdmin is true', () => {
			const resource = { userId: 'otherUser', name: 'Their Recipe' }
			expect(() => requireOwnership(adminUser, resource, { allowAdmin: true })).not.toThrow()
		})

		it('denies admin access when allowAdmin is false (default)', () => {
			const resource = { userId: 'otherUser', name: 'Their Recipe' }
			expect(() => requireOwnership(adminUser, resource)).toThrow()
			try {
				requireOwnership(adminUser, resource)
			} catch (e) {
				expect(e.status).toBe(403)
			}
		})
	})

	describe('requireAccessOrPublic', () => {
		const authLocals = { user: { userId: 'user123', isAdmin: false } }
		const adminLocals = { user: { userId: 'admin1', isAdmin: true } }
		const anonLocals = { user: null }

		it('allows access to public resources for anonymous users', () => {
			const resource = { userId: 'otherUser', is_public: true }
			expect(() => requireAccessOrPublic(anonLocals, resource)).not.toThrow()
		})

		it('allows access to public resources for authenticated users', () => {
			const resource = { userId: 'otherUser', is_public: true }
			expect(() => requireAccessOrPublic(authLocals, resource)).not.toThrow()
		})

		it('allows owner access to private resources', () => {
			const resource = { userId: 'user123', is_public: false }
			expect(() => requireAccessOrPublic(authLocals, resource)).not.toThrow()
		})

		it('throws 403 for anonymous users on private resources', () => {
			const resource = { userId: 'otherUser', is_public: false }
			expect(() => requireAccessOrPublic(anonLocals, resource)).toThrow()
			try {
				requireAccessOrPublic(anonLocals, resource)
			} catch (e) {
				expect(e.status).toBe(403)
				expect(e.body.message).toBe('Access denied: this resource is private')
			}
		})

		it('throws 403 for non-owner on private resources', () => {
			const resource = { userId: 'otherUser', is_public: false }
			expect(() => requireAccessOrPublic(authLocals, resource)).toThrow()
			try {
				requireAccessOrPublic(authLocals, resource)
			} catch (e) {
				expect(e.status).toBe(403)
			}
		})

		it('throws 404 when resource is null', () => {
			expect(() => requireAccessOrPublic(authLocals, null)).toThrow()
			try {
				requireAccessOrPublic(authLocals, null)
			} catch (e) {
				expect(e.status).toBe(404)
			}
		})

		it('allows admin access when allowAdmin is true', () => {
			const resource = { userId: 'otherUser', is_public: false }
			expect(() => requireAccessOrPublic(adminLocals, resource, { allowAdmin: true })).not.toThrow()
		})

		it('checks owner publicRecipes when checkOwnerPublic is true', () => {
			const resource = { userId: 'otherUser', is_public: false, user: { publicRecipes: true } }
			expect(() =>
				requireAccessOrPublic(anonLocals, resource, { checkOwnerPublic: true })
			).not.toThrow()
		})
	})

	describe('getOptionalUser', () => {
		it('returns user when authenticated', () => {
			const locals = { user: { userId: 'user123', username: 'testuser' } }
			const user = getOptionalUser(locals)
			expect(user).toEqual(locals.user)
		})

		it('returns null when not authenticated', () => {
			const locals = { user: null }
			const user = getOptionalUser(locals)
			expect(user).toBeNull()
		})

		it('returns null when user is undefined', () => {
			const locals = {}
			const user = getOptionalUser(locals)
			expect(user).toBeNull()
		})
	})

	describe('jsonSuccess', () => {
		it('returns JSON response with data and default 200 status', async () => {
			const data = { recipe: { name: 'Test Recipe' } }
			const response = jsonSuccess(data)

			expect(response).toBeInstanceOf(Response)
			expect(response.status).toBe(200)

			const body = await response.json()
			expect(body).toEqual(data)
		})

		it('returns JSON response with custom status', async () => {
			const data = { created: { id: 'new123' } }
			const response = jsonSuccess(data, 201)

			expect(response.status).toBe(201)

			const body = await response.json()
			expect(body).toEqual(data)
		})
	})

	describe('jsonError', () => {
		it('returns JSON error response with status and message', async () => {
			const response = jsonError(400, 'Invalid input')

			expect(response).toBeInstanceOf(Response)
			expect(response.status).toBe(400)

			const body = await response.json()
			expect(body).toEqual({ error: 'Invalid input' })
		})

		it('handles 404 errors', async () => {
			const response = jsonError(404, 'Recipe not found')

			expect(response.status).toBe(404)

			const body = await response.json()
			expect(body).toEqual({ error: 'Recipe not found' })
		})

		it('handles 500 errors', async () => {
			const response = jsonError(500, 'Internal server error')

			expect(response.status).toBe(500)

			const body = await response.json()
			expect(body).toEqual({ error: 'Internal server error' })
		})
	})
})
