// src/routes/api/oauth/callback/+server.js
import { redirect } from '@sveltejs/kit'
import { dev } from '$app/environment'
import { prisma } from '$lib/server/prisma.js'
import { auth } from '$lib/server/lucia.js'
import { githubAuth, googleAuth } from '$lib/server/oauth.js'
import { oidcEnabled, validateCallback as validateOidcCallback } from '$lib/server/oidc.js'
import { OAuthRequestError } from '@lucia-auth/oauth'

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

/**
 * Link an existing AuthAccount or create a new one for a provider+sub pair.
 * This consolidates OIDC users with existing accounts matched by email.
 *
 * @param {string} providerId - The provider identifier (e.g. 'oidc')
 * @param {string} providerUserId - The provider's user ID (sub claim)
 * @param {string} userId - The local user ID to link to
 */
async function linkProviderAccount(providerId, providerUserId, userId) {
	const existing = await prisma.authAccount.findFirst({
		where: { provider_id: providerId, provider_user_id: providerUserId }
	})
	if (!existing) {
		await prisma.authAccount.create({
			data: {
				id: crypto.randomUUID(),
				provider_id: providerId,
				provider_user_id: providerUserId,
				user_id: userId
			}
		})
	}
}

/**
 * Create a new user for an OIDC login with the given attributes.
 *
 * @param {string} providerId - The provider identifier (e.g. 'oidc')
 * @param {string} providerUserId - The provider's sub claim
 * @param {Object} attrs - User attributes
 * @param {string} attrs.username - The username
 * @param {string|null} attrs.email - The email (if available)
 * @returns {Promise<Object>} The created user
 */
async function createOidcUser(providerId, providerUserId, attrs) {
	const user = await auth.createUser({
		key: null, // No password-based key for OIDC users
		attributes: attrs
	})
	await linkProviderAccount(providerId, providerUserId, user.userId)
	return user
}

// ---- OIDC callback handler ----
async function handleOidcCallback(url, cookies, locals) {
	const storedState = cookies.get('oauth_state')
	const codeVerifier = cookies.get('oauth_code_verifier')

	if (!storedState || !codeVerifier) {
		return bounce(cookies, 'Invalid OIDC state. Please try again.')
	}

	let oidcUser
	try {
		oidcUser = await validateOidcCallback(url, storedState, codeVerifier)
	} catch (err) {
		console.error('[OIDC] Token exchange failed:', err)
		const detail = dev ? `: ${err.message}` : ''
		return bounce(cookies, `OIDC authentication failed${detail}. Please try again.`)
	}

	const { email, username: oidcUsername, sub, emailVerified } = oidcUser

	// 1) Check if already linked via AuthAccount
	const existingAccount = await prisma.authAccount.findFirst({
		where: { provider_id: 'oidc', provider_user_id: sub }
	})

	if (existingAccount) {
		// Already linked — just log in
		const dbUser = await prisma.authUser.findUnique({ where: { id: existingAccount.user_id } })
		if (!dbUser) {
			return bounce(cookies, 'Account no longer exists. Please contact an administrator.')
		}
		const user = auth.transformDatabaseUser(dbUser)
		const session = await auth.createSession({ userId: user.userId, attributes: {} })
		await locals.auth.setSession(session)
		clearOauthCookies(cookies)
		throw redirect(303, `/user/${user.userId}/recipes`)
	}

	// 2) Not linked — try email match for consolidation (only with verified email)
	if (email && emailVerified) {
		const existingUser = await prisma.authUser.findUnique({ where: { email } })
		if (existingUser) {
			// Consolidate: link this OIDC identity to the existing user
			await linkProviderAccount('oidc', sub, existingUser.id)
			const user = auth.transformDatabaseUser(existingUser)
			const session = await auth.createSession({ userId: user.userId, attributes: {} })
			await locals.auth.setSession(session)
			clearOauthCookies(cookies)
			throw redirect(303, `/user/${user.userId}/recipes`)
		}
	}

	// 3) No existing user — check auto-provisioning (separate from registration toggle)
	const oidcAutoProvision = locals.site?.settings?.oidcAutoProvision ?? true
	if (!oidcAutoProvision) {
		return bounce(
			cookies,
			'Automatic account creation via OIDC is disabled. Please ask an administrator to create your account first.'
		)
	}

	// 4) Create a new user
	const usernameBase = oidcUsername || (email ? email.split('@')[0] : 'oidc')
	const uniqueUsername = await ensureUniqueUsername(usernameBase)
	const attrs = email ? { username: uniqueUsername, email } : { username: uniqueUsername }

	const user = await createOidcUser('oidc', sub, attrs)
	const session = await auth.createSession({ userId: user.userId, attributes: {} })
	await locals.auth.setSession(session)
	clearOauthCookies(cookies)
	throw redirect(303, `/user/${user.userId}/recipes`)
}

// ---- GitHub/Google callback handler (existing logic) ----
async function handleLegacyOauthCallback(provider, url, cookies, locals) {
	const code = url.searchParams.get('code')

	// 1) validate with provider
	let pa
	if (provider === 'github') {
		pa = await githubAuth.validateCallback(code)
	} else if (provider === 'google') {
		const verifier = cookies.get('oauth_code_verifier') || null
		pa = await googleAuth.validateCallback(code, verifier)
	} else {
		return bounce(cookies, 'Unsupported provider.')
	}

	const registrationAllowed = !!locals.site?.settings?.registrationAllowed

	// 2) already linked?
	let user = await pa.getExistingUser()

	// 3) not linked → try email match and link
	if (!user) {
		let email = null
		let usernameBase = provider === 'github' ? 'gh' : 'gg'

		if (provider === 'github') {
			usernameBase = pa.githubUser?.login || 'gh'
			email =
				pa.githubUser?.email || (await getGithubVerifiedEmail(pa.githubTokens.accessToken)) || null
		} else {
			usernameBase = pa.googleUser?.name || pa.googleUser?.email?.split('@')[0] || 'gg'
			if (pa.googleUser?.email && (pa.googleUser.email_verified ?? pa.googleUser.emailVerified)) {
				email = pa.googleUser.email
			} else {
				const info = await getGoogleUserInfo(pa.googleTokens.accessToken)
				if (info?.email && info?.email_verified) email = info.email
			}
		}

		if (email) {
			const existing = await prisma.authUser.findUnique({ where: { email } })
			if (existing) {
				const linked = auth.transformDatabaseUser(existing)
				await pa.createKey(linked.userId)
				user = linked
			}
		}
	}

	// 4) still no user & sign-ups OFF → bounce to login with message
	if (!user && !registrationAllowed) {
		return bounce(cookies, 'Sign-ups are disabled. Use an existing account.')
	}

	// 5) still no user & sign-ups ON → create
	if (!user) {
		const base =
			(provider === 'github' ? pa.githubUser?.login : pa.googleUser?.name) ||
			(provider === 'github' ? pa.githubUser?.email : pa.googleUser?.email)?.split('@')[0] ||
			(provider === 'github' ? 'gh' : 'gg')

		const username = await ensureUniqueUsername(base)

		let email = null
		if (provider === 'github') {
			email =
				pa.githubUser?.email || (await getGithubVerifiedEmail(pa.githubTokens.accessToken)) || null
		} else {
			email =
				pa.googleUser?.email && (pa.googleUser.email_verified ?? pa.googleUser.emailVerified)
					? pa.googleUser.email
					: ((await getGoogleUserInfo(pa.googleTokens.accessToken))?.email ?? null)
		}

		const attrs = email ? { username, email } : { username }
		user = await pa.createUser({ attributes: attrs })
	}

	// 6) log in
	const session = await auth.createSession({ userId: user.userId, attributes: {} })
	await locals.auth.setSession(session)

	clearOauthCookies(cookies)
	throw redirect(303, `/user/${user.userId}/recipes`)
}

export async function GET({ url, cookies, locals }) {
	const provider = cookies.get('oauth_provider')
	const storedState = cookies.get('oauth_state')
	const state = url.searchParams.get('state')
	const code = url.searchParams.get('code')

	if (!provider || !storedState || !state || storedState !== state || !code) {
		return bounce(cookies, 'Invalid OAuth state. Please try again.')
	}

	try {
		if (provider === 'oidc') {
			return await handleOidcCallback(url, cookies, locals)
		}

		return await handleLegacyOauthCallback(provider, url, cookies, locals)
	} catch (e) {
		// let actual redirects bubble
		if (e && typeof e === 'object' && 'location' in e && e.status >= 300 && e.status < 400) throw e

		// expected OAuth failures → bounce to login with a friendly message
		if (e instanceof OAuthRequestError) {
			return bounce(cookies, dev ? `OAuth failed: ${e.message}` : 'OAuth failed. Please try again.')
		}

		// Handle OIDC-specific errors
		if (e?.code === 'ERR_JWT_CLAIM_VALIDATION_FAILED' || e?.code === 'ERR_JWT_EXPIRED') {
			return bounce(cookies, 'OIDC token validation failed. Please try again.')
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
