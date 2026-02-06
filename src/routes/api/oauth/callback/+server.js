// src/routes/api/oauth/callback/+server.js
import { error as svelteError, redirect } from '@sveltejs/kit'
import { dev } from '$app/environment'
import { prisma } from '$lib/server/prisma.js'
import { auth } from '$lib/server/lucia.js'
import { githubAuth, googleAuth, oidcAuth } from '$lib/server/oauth.js'
import { OAuthRequestError } from '@lucia-auth/oauth'
import * as oidcClient from 'openid-client'

// --- helpers ---
function clearOauthCookies(cookies) {
	const opts = { path: '/', secure: !dev }
	cookies.delete('oauth_state', opts)
	cookies.delete('oauth_provider', opts)
	cookies.delete('oauth_code_verifier', opts)
}
function bounce(cookies, msg, status = 303) {
	clearOauthCookies(cookies)
	throw redirect(status, `/login?message=${encodeURIComponent(msg)}`)
}

// GitHub email fetch (when not present on profile)
async function getGithubVerifiedEmail(accessToken) {
	const res = await fetch('https://api.github.com/user/emails', {
		headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'sveltekit-app' }
	})
	if (!res.ok) return null
	const emails = await res.json()
	const primary = emails.find((e) => e.primary && e.verified)
	return primary?.email || emails.find((e) => e.verified)?.email || null
}

// Google userinfo fallback
async function getGoogleUserInfo(accessToken) {
	const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
		headers: { Authorization: `Bearer ${accessToken}` }
	})
	if (!res.ok) return null
	return await res.json()
}

async function ensureUniqueUsername(base) {
	let candidate = base || 'user'
	for (let i = 1; ; i++) {
		const exists = await prisma.authUser.findUnique({ where: { username: candidate } })
		if (!exists) return candidate
		candidate = `${base}${i}`
	}
}

export async function GET({ url, cookies, locals }) {
	const provider = cookies.get('oauth_provider')
	const storedState = cookies.get('oauth_state')
	const state = url.searchParams.get('state')
	const code = url.searchParams.get('code')
	if (!provider || !storedState || !state || storedState !== state || !code) {
		// stay in UI
		return bounce(cookies, 'Invalid OAuth state. Please try again.')
	}

	try {
		// 1) validate with provider
		let pa
		if (provider === 'github') {
			pa = await githubAuth.validateCallback(code)
		} else if (provider === 'google') {
			const verifier = cookies.get('oauth_code_verifier') || null
			pa = await googleAuth.validateCallback(code, verifier)
		} else if (provider === 'oidc') {
			const verifier = cookies.get('oauth_code_verifier') || null
			pa = await oidcAuth.validateCallback(code, verifier, url, storedState)
		} else {
			return bounce(cookies, 'Unsupported provider.')
		}

		const registrationAllowed = !!locals.site?.settings?.registrationAllowed
		const oidcAutoProvision = locals.site?.settings?.oidcAutoProvision ?? true

		// 2) already linked?
		let user = await pa.getExistingUser()

		// 3) not linked → try email match and link
		if (!user) {
			let email = null
			let usernameBase = provider === 'github' ? 'gh' : provider === 'google' ? 'gg' : 'oidc'

			if (provider === 'github') {
				usernameBase = pa.githubUser?.login || 'gh'
				email =
					pa.githubUser?.email ||
					(await getGithubVerifiedEmail(pa.githubTokens.accessToken)) ||
					null
			} else if (provider === 'google') {
				usernameBase = pa.googleUser?.name || pa.googleUser?.email?.split('@')[0] || 'gg'
				if (pa.googleUser?.email && (pa.googleUser.email_verified ?? pa.googleUser.emailVerified)) {
					email = pa.googleUser.email
				} else {
					const info = await getGoogleUserInfo(pa.googleTokens.accessToken)
					if (info?.email && info?.email_verified) email = info.email
				}
			} else if (provider === 'oidc') {
				const oidcEmail = pa.oidcUser?.email || pa.oidcUser?.unverifiedEmail || null
				usernameBase = pa.oidcUser?.name || oidcEmail?.split('@')[0] || 'oidc'
				// Use verified email; fall back to unverified for linking to existing accounts
				email = oidcEmail
			}

			if (email) {
				// Exact match first; if not found, try lowercase for case-insensitive linking
				let existing = await prisma.authUser.findUnique({ where: { email } })
				if (!existing) {
					existing = await prisma.authUser.findUnique({ where: { email: email.toLowerCase() } })
				}
				if (existing) {
					const linked = auth.transformDatabaseUser(existing)
					await pa.createKey(linked.userId)
					user = linked
				}
			}
		}

		// 4) still no user → check registration / provisioning gates
		if (!user && provider === 'oidc' && !oidcAutoProvision) {
			return bounce(
				cookies,
				'OIDC account provisioning is disabled. Ask an administrator to create your account.'
			)
		}
		if (!user && !registrationAllowed) {
			return bounce(cookies, 'Sign-ups are disabled. Use an existing account.')
		}

		// 5) still no user & sign-ups ON → create
		if (!user) {
			const base =
				provider === 'oidc'
					? pa.oidcUser?.name || pa.oidcUser?.email?.split('@')[0] || 'oidc'
					: (provider === 'github' ? pa.githubUser?.login : pa.googleUser?.name) ||
						(provider === 'github' ? pa.githubUser?.email : pa.googleUser?.email)?.split('@')[0] ||
						(provider === 'github' ? 'gh' : 'gg')

			const username = await ensureUniqueUsername(base)

			let email = null
			if (provider === 'github') {
				email =
					pa.githubUser?.email ||
					(await getGithubVerifiedEmail(pa.githubTokens.accessToken)) ||
					null
			} else if (provider === 'google') {
				email =
					pa.googleUser?.email && (pa.googleUser.email_verified ?? pa.googleUser.emailVerified)
						? pa.googleUser.email
						: ((await getGoogleUserInfo(pa.googleTokens.accessToken))?.email ?? null)
			} else if (provider === 'oidc') {
				email = pa.oidcUser?.email || null
			}

			const attrs = email ? { username, email } : { username }
			user = await pa.createUser({ attributes: attrs })
		}

		// 6) log in
		const session = await auth.createSession({ userId: user.userId, attributes: {} })
		await locals.auth.setSession(session)

		clearOauthCookies(cookies)
		throw redirect(303, `/user/${user.userId}/recipes`)
	} catch (e) {
		// let actual redirects bubble
		if (e && typeof e === 'object' && 'location' in e && e.status >= 300 && e.status < 400) throw e

		// expected OAuth failures → bounce to login with a friendly message
		if (e instanceof OAuthRequestError) {
			// e.g. invalid/expired code, PKCE mismatch, user denied consent, etc.
			return bounce(cookies, dev ? `OAuth failed: ${e.message}` : 'OAuth failed. Please try again.')
		}

		// openid-client errors (OIDC provider failures)
		if (
			e instanceof oidcClient.AuthorizationResponseError ||
			e instanceof oidcClient.ClientError ||
			e instanceof oidcClient.ResponseBodyError
		) {
			console.error('OIDC callback error:', e)
			return bounce(
				cookies,
				dev ? `OIDC failed: ${e.message}` : 'OIDC authentication failed. Please try again.'
			)
		}

		// (optionally) handle HTTP-ish errors with a message
		if (e?.status === 400 && e?.body?.message) {
			return bounce(cookies, e.body.message)
		}

		// unexpected → still keep the user in UI with a generic message
		console.error('OAuth callback error:', e)
		return bounce(cookies, 'Something went wrong during sign-in. Please try again.')
	}
}
