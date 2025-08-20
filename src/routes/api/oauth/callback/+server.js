// src/routes/api/oauth/callback/+server.js
import { error as svelteError, redirect } from '@sveltejs/kit'
import { dev } from '$app/environment'
import { prisma } from '$lib/server/prisma.js'
import { auth } from '$lib/server/lucia.js'
import { githubAuth } from '$lib/server/oauth.js'
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, ORIGIN } from '$env/static/private'

async function getGithubVerifiedEmail(accessToken) {
	const res = await fetch('https://api.github.com/user/emails', {
		headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'sveltekit-app' }
	})
	if (!res.ok) return null
	const emails = await res.json()
	const primary = emails.find((e) => e.primary && e.verified)
	return primary?.email || emails.find((e) => e.verified)?.email || null
}

async function ensureUniqueUsername(base) {
	let candidate = base || 'user'
	let i = 1
	while (true) {
		const exists = await prisma.authUser.findUnique({ where: { username: candidate } })
		if (!exists) return candidate
		candidate = `${base}${i++}`
	}
}

export async function GET({ url, cookies, locals }) {
	const provider = cookies.get('oauth_provider')
	const storedState = cookies.get('oauth_state')
	const state = url.searchParams.get('state')
	const code = url.searchParams.get('code')

	if (provider !== 'github' || !storedState || !state || storedState !== state || !code) {
		throw svelteError(400, 'Invalid OAuth state')
	}

	try {
		let pa
		try {
			// normal Lucia path
			pa = await githubAuth.validateCallback(code)
		} catch (e) {
			// ===== DEV DIAGNOSTIC: ask GitHub directly why token failed =====
			const BASE = ORIGIN?.trim().replace(/\/$/, '')
			const params = new URLSearchParams({
				client_id: GITHUB_CLIENT_ID.trim(),
				client_secret: GITHUB_CLIENT_SECRET.trim(),
				code,
				redirect_uri: `${BASE}/api/oauth/callback`
			})
			const r = await fetch('https://github.com/login/oauth/access_token', {
				method: 'POST',
				headers: { Accept: 'application/json' },
				body: params
			})
			const j = await r.json()
			console.error('Token exchange result:', j)
			// Typical messages:
			//  - "bad_verification_code"
			//  - "redirect_uri_mismatch"
			//  - "incorrect_client_credentials"
			throw svelteError(400, j.error_description || 'GitHub token exchange failed')
		}

		// At this point we DO have tokens
		const token = pa.githubTokens.accessToken

		// Already linked?
		let user = await pa.getExistingUser()

		if (!user) {
			// Try to get an email (optional)
			let email = pa.githubUser?.email || (await getGithubVerifiedEmail(token)) || null

			// Link to existing local by email if present
			if (email) {
				const existing = await prisma.authUser.findUnique({ where: { email } })
				if (existing) {
					const linked = auth.transformDatabaseUser(existing)
					await pa.createKey(linked.userId)
					user = linked
				}
			}

			// Create a new user (email optional)
			if (!user) {
				const base = pa.githubUser?.login || (email ? email.split('@')[0] : 'gh')
				const username = await ensureUniqueUsername(base)
				const attrs = email ? { username, email } : { username }
				user = await pa.createUser({ attributes: attrs })
			}
		}

		// Log in
		const session = await auth.createSession({ userId: user.userId, attributes: {} })
		await locals.auth.setSession(session)

		// clean up
		cookies.delete('oauth_state', { path: '/', secure: !dev })
		cookies.delete('oauth_provider', { path: '/', secure: !dev })

		throw redirect(303, `/user/${user.userId}/recipes`)
	} catch (e) {
		// let redirects bubble
		if (e && typeof e === 'object' && 'location' in e && e.status >= 300 && e.status < 400) {
			throw e
		}
		// handle provider errors if you want, else generic:
		// if (e instanceof OAuthRequestError) throw svelteError(400, 'Invalid code');
		console.error('OAuth callback error:', e)
		throw svelteError(500, 'OAuth processing failed.')
	}
}
