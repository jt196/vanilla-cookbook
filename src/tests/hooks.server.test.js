import { describe, it, expect, vi, beforeEach } from 'vitest'

const state = vi.hoisted(() => ({ user: null, settingsRow: null, env: {} }))

vi.mock('$env/dynamic/private', () => ({ env: state.env }))
vi.mock('$lib/server/lucia', () => ({
	auth: {
		sessionCookieName: 'auth_session',
		handleRequest: () => ({
			validate: async () => (state.user ? { user: state.user } : null)
		})
	}
}))
vi.mock('$lib/server/prisma', () => ({
	prisma: { siteSettings: { findFirst: async () => state.settingsRow } }
}))
vi.mock('$lib/utils/seed/seedHelpers', () => ({ dbSeeded: async () => true }))
vi.mock('$lib/server/rateLimit', () => ({ getClientIp: () => '1.2.3.4', makeLimiter: () => ({}) }))

import { handle } from '../hooks.server.js'

import { fake } from './helpers/fake.js'
/**
 * @param {string} path
 * @param {{ method?: string, origin?: string, protocol?: string }} [options]
 */
function makeEvent(path, { method = 'GET', origin, protocol = 'https:' } = {}) {
	const url = new URL(`${protocol}//cook.example${path}`)
	return {
		url,
		request: new Request(url, { method, headers: origin ? { origin } : {} }),
		locals: {}
	}
}

const ok = () => async () => new Response('ok')

describe('hooks.server handle', () => {
	beforeEach(() => {
		state.user = null
		state.settingsRow = { requireLogin: false, registrationAllowed: true }
		for (const key of Object.keys(state.env)) delete state.env[key]
	})

	it('populates locals with the user and site config', async () => {
		state.user = { userId: 'u1' }
		const event = makeEvent('/')
		await handle({ event: fake(event), resolve: ok() })
		expect(event.locals.user).toEqual({ userId: 'u1' })
		expect(event.locals.site).toMatchObject({
			dbSeeded: true,
			settings: { registrationAllowed: true, requireLogin: false }
		})
	})

	describe('with "require login" on', () => {
		beforeEach(() => {
			state.settingsRow = { requireLogin: true }
		})

		it('returns 401 JSON for anonymous API requests', async () => {
			const res = await handle({ event: fake(makeEvent('/api/recipe/all')), resolve: ok() })
			expect(res.status).toBe(401)
			expect(await res.json()).toEqual({ error: 'Authentication required' })
		})

		it('redirects anonymous page requests to /login', async () => {
			await expect(
				handle({ event: fake(makeEvent('/recipes')), resolve: ok() })
			).rejects.toMatchObject({
				status: 302,
				location: '/login'
			})
		})

		it.each(['/login', '/register', '/api/health', '/_app/immutable/x.js'])(
			'lets anonymous requests to %s through',
			async (path) => {
				const res = await handle({ event: fake(makeEvent(path)), resolve: ok() })
				expect(await res.text()).toBe('ok')
			}
		)

		it('lets logged-in users through', async () => {
			state.user = { userId: 'u1' }
			const res = await handle({ event: fake(makeEvent('/recipes')), resolve: ok() })
			expect(await res.text()).toBe('ok')
		})
	})

	describe('session cookie over plain HTTP', () => {
		const withCookies = () => async () => {
			const res = new Response('ok')
			res.headers.append('set-cookie', 'auth_session=abc; Path=/; HttpOnly; Secure')
			res.headers.append('set-cookie', 'other=1; Path=/; Secure')
			return res
		}

		it('strips Secure from the session cookie only', async () => {
			const res = await handle({
				event: fake(makeEvent('/', { protocol: 'http:' })),
				resolve: withCookies()
			})
			expect(res.headers.getSetCookie()).toEqual([
				'auth_session=abc; Path=/; HttpOnly',
				'other=1; Path=/; Secure'
			])
		})

		it('leaves cookies alone over HTTPS', async () => {
			const res = await handle({ event: fake(makeEvent('/')), resolve: withCookies() })
			expect(res.headers.getSetCookie()[0]).toContain('Secure')
		})

		it('strips Secure when ORIGIN is http even behind an HTTPS-terminating proxy', async () => {
			state.env.ORIGIN = 'http://192.168.1.5:3000'
			const res = await handle({ event: fake(makeEvent('/')), resolve: withCookies() })
			expect(res.headers.getSetCookie()[0]).not.toContain('Secure')
		})
	})

	describe('CORS', () => {
		it('answers preflight requests from allowed dev origins', async () => {
			const resolve = vi.fn()
			const res = await handle({
				event: fake(makeEvent('/api/x', { method: 'OPTIONS', origin: 'http://localhost:5173' })),
				resolve
			})
			expect(res.status).toBe(204)
			expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173')
			expect(resolve).not.toHaveBeenCalled()
		})

		it('adds CORS headers for allowed origins and not for others', async () => {
			const allowed = await handle({
				event: fake(makeEvent('/api/x', { origin: 'http://localhost:3000' })),
				resolve: ok()
			})
			expect(allowed.headers.get('Access-Control-Allow-Credentials')).toBe('true')
			expect(allowed.headers.get('Vary')).toBe('Origin')

			const other = await handle({
				event: fake(makeEvent('/api/x', { origin: 'https://evil.example' })),
				resolve: ok()
			})
			expect(other.headers.get('Access-Control-Allow-Origin')).toBeNull()
		})
	})
})
