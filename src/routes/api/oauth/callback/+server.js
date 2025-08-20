// src/routes/api/oauth/callback/+server.js
import { error as svelteError, redirect } from '@sveltejs/kit'
import { dev } from '$app/environment'
import { prisma } from '$lib/server/prisma.js'
import { auth } from '$lib/server/lucia.js'
import { githubAuth, googleAuth } from '$lib/server/oauth.js'

// GitHub may not return email at /user; fetch verified emails if needed
async function getGithubVerifiedEmail(accessToken) {
	const res = await fetch('https://api.github.com/user/emails', {
		headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'sveltekit-app' }
	})
	if (!res.ok) return null
	const emails = await res.json()
	const primary = emails.find((e) => e.primary && e.verified)
	return primary?.email || emails.find((e) => e.verified)?.email || null
}

// Google almost always returns email + email_verified with openid/email scope.
// This is a fallback if you want to be extra sure.
async function getGoogleUserInfo(accessToken) {
	const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
		headers: { Authorization: `Bearer ${accessToken}` }
	})
	if (!res.ok) return null
	return await res.json() // { email, email_verified, name, picture, ... }
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
	if (!provider || !storedState || !state || storedState !== state || !code) {
		throw svelteError(400, 'Invalid OAuth state')
	}

	try {
		let pa // provider auth object from Lucia
		if (provider === 'github') {
			pa = await githubAuth.validateCallback(code)
		} else if (provider === 'google') {
			const codeVerifier = cookies.get('oauth_code_verifier') || null
			// Google uses PKCE; pass the verifier if we have it
			pa = await googleAuth.validateCallback(code, codeVerifier)
		} else {
			throw svelteError(400, 'Unknown provider')
		}

		// Try an existing linked account first
		let user = await pa.getExistingUser()

		if (!user) {
			// Try to obtain an email (OPTIONAL — your schema allows null)
			let email = null
			let usernameBase = provider === 'github' ? 'gh' : 'gg'

			if (provider === 'github') {
				usernameBase = pa.githubUser?.login || 'gh'
				email =
					pa.githubUser?.email ||
					(await getGithubVerifiedEmail(pa.githubTokens.accessToken)) ||
					null
			} else {
				// Google
				usernameBase = pa.googleUser?.name || pa.googleUser?.email?.split('@')[0] || 'gg'
				if (pa.googleUser?.email && (pa.googleUser.email_verified ?? pa.googleUser.emailVerified)) {
					email = pa.googleUser.email
				} else {
					const info = await getGoogleUserInfo(pa.googleTokens.accessToken)
					if (info?.email && info?.email_verified) email = info.email
				}
			}

			// Link to an existing local account if email matches
			if (email) {
				const existing = await prisma.authUser.findUnique({ where: { email } })
				if (existing) {
					const linked = auth.transformDatabaseUser(existing)
					await pa.createKey(linked.userId) // link provider → user
					user = linked
				}
			}

			// Create a new user via Lucia (email optional)
			if (!user) {
				const username = await ensureUniqueUsername(usernameBase)
				const attrs = email ? { username, email } : { username }
				user = await pa.createUser({ attributes: attrs })
			}
		}

		// Session + redirect
		const session = await auth.createSession({ userId: user.userId, attributes: {} })
		await locals.auth.setSession(session)

		cookies.delete('oauth_state', { path: '/', secure: !dev })
		cookies.delete('oauth_provider', { path: '/', secure: !dev })
		cookies.delete('oauth_code_verifier', { path: '/', secure: !dev })

		throw redirect(303, `/user/${user.userId}/recipes`)
	} catch (e) {
		// Let SvelteKit redirects bubble
		if (e && typeof e === 'object' && 'location' in e && e.status >= 300 && e.status < 400) {
			throw e
		}
		console.error('OAuth callback error:', e)
		throw svelteError(500, 'OAuth processing failed.')
	}
}
