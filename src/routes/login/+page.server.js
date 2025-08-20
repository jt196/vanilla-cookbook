import { auth } from '$lib/server/lucia'
import { fail, redirect } from '@sveltejs/kit'
import { prisma } from '$lib/server/prisma'

/**
 * Validates if the user is logged in and redirects if necessary.
 *
 * @param {Object} context - The context object.
 * @param {AppLocals} context.locals - Local variables.
 */
export const load = async ({ locals, url }) => {
	const user = locals.user
	const { settings, oauth } = locals.site
	if (user) {
		throw redirect(302, '/')
	}
	// Capture form failure messages from query parameters (SSR safe)
	const message = url.searchParams.get('message') ?? null

	return {
		settings,
		oauth,
		message
	}
}

/**
 * Actions related to login, such as default login.
 *
 * @type {Object}
 */
export const actions = {
	default: async ({ request, locals }) => {
		const form = Object.fromEntries(await request.formData())
		const identifier = (form.identifier ?? form.username ?? '').toString().trim()
		const password = (form.password ?? '').toString()

		if (!identifier || !password) {
			return fail(400, { message: 'Missing username/email or password.' })
		}

		const ipHit = locals.limiter.loginByIp(locals.clientIp || 'unknown')
		if (!ipHit.ok) return fail(429, { message: 'Too many attempts. Try again soon.' })

		const idHit = locals.limiter.loginById(identifier.toLowerCase())
		if (!idHit.ok) return fail(429, { message: 'Too many attempts for this account.' })

		try {
			let key
			try {
				// try as username
				key = await auth.useKey('username', identifier, password)
			} catch (err) {
				// if no such username, try email -> lookup -> use username key
				if (err?.message !== 'AUTH_INVALID_KEY_ID') throw err

				if (!identifier.includes('@')) throw err // not an email, rethrow

				// normalize email (recommend storing lowercased at registration)
				const email = identifier.toLowerCase()
				const user = await prisma.authUser.findUnique({ where: { email } })
				if (!user) throw err

				key = await auth.useKey('username', user.username, password)
			}

			const session = await auth.createSession({ userId: key.userId, attributes: {} })
			await locals.auth.setSession(session)
			throw redirect(302, '/')
		} catch (err) {
			console.error(err)

			// Optional: avoid user enumeration by using the same message for both cases
			if (err?.message === 'AUTH_INVALID_PASSWORD' || err?.message === 'AUTH_INVALID_KEY_ID') {
				return fail(400, { message: 'Invalid credentials.' })
			}
			return fail(400, { message: 'Could not login user.' })
		}
	}
}
