// src/lib/server/oidc.js
/**
 * Generic OIDC provider for self-hosted identity providers (Authentik, Keycloak, etc.)
 *
 * Uses `openid-client` v6 for discovery, authorization URL generation,
 * token exchange, and ID token validation with PKCE.
 *
 * @module
 */
import * as client from 'openid-client'
import { env } from '$env/dynamic/private'

const ISSUER_URL = env.OIDC_ISSUER_URL?.trim() || ''
const CLIENT_ID = env.OIDC_CLIENT_ID?.trim() || ''
const CLIENT_SECRET = env.OIDC_CLIENT_SECRET?.trim() || ''
const BASE = env.ORIGIN?.trim()?.replace(/\/$/, '')

/** Display name for the login button */
export const oidcName = env.OIDC_NAME?.trim() || 'OIDC'

/** Claim used for email extraction */
export const oidcEmailClaim = env.OIDC_EMAIL_CLAIM?.trim() || 'email'

/** Claim used for username extraction */
export const oidcNameClaim = env.OIDC_NAME_CLAIM?.trim() || 'preferred_username'

/** Scopes to request */
export const oidcScopes = env.OIDC_SCOPES?.trim() || 'openid email profile'

/** Whether OIDC is configured (all three required env vars present) */
export const oidcEnabled = !!(ISSUER_URL && CLIENT_ID && CLIENT_SECRET && BASE)

/** Redirect URI for the OIDC callback */
const REDIRECT_URI = `${BASE}/api/oauth/callback`

/** Cached configuration (discovered once, reused) */
let _config = null
let _configPromise = null

/**
 * Discover and cache the OIDC configuration from the issuer.
 * Uses openid-client v6 discovery which fetches .well-known/openid-configuration.
 *
 * @returns {Promise<import('openid-client').Configuration>}
 * @throws {Error} If discovery fails
 */
export async function getOidcConfig() {
	if (_config) return _config

	// Prevent concurrent discovery calls
	if (_configPromise) return _configPromise

	_configPromise = (async () => {
		try {
			const issuerUrl = new URL(ISSUER_URL)
			const isHttp = issuerUrl.protocol === 'http:'

			const config = await client.discovery(
				issuerUrl,
				CLIENT_ID,
				CLIENT_SECRET,
				undefined, // use default ClientSecretPost
				isHttp ? { execute: [client.allowInsecureRequests] } : undefined
			)

			_config = config
			console.log(`[OIDC] Discovery successful for issuer: ${ISSUER_URL}`)
			return config
		} catch (err) {
			_configPromise = null // Allow retry on next call
			console.error(`[OIDC] Discovery failed for ${ISSUER_URL}:`, err.message)
			throw new Error(`OIDC discovery failed: ${err.message}`)
		}
	})()

	return _configPromise
}

/**
 * Build the authorization URL with PKCE.
 *
 * @returns {Promise<{url: URL, state: string, codeVerifier: string}>}
 */
export async function getAuthorizationUrl() {
	const config = await getOidcConfig()

	const codeVerifier = client.randomPKCECodeVerifier()
	const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier)
	const state = client.randomState()

	const url = client.buildAuthorizationUrl(config, {
		redirect_uri: REDIRECT_URI,
		scope: oidcScopes,
		code_challenge: codeChallenge,
		code_challenge_method: 'S256',
		state
	})

	return { url, state, codeVerifier }
}

/**
 * Exchange the authorization code for tokens and extract user claims.
 *
 * @param {URL} callbackUrl - The full callback URL with query parameters
 * @param {string} expectedState - The state value from the cookie
 * @param {string} codeVerifier - The PKCE code verifier from the cookie
 * @returns {Promise<{email: string|null, username: string|null, sub: string, emailVerified: boolean}>}
 */
export async function validateCallback(callbackUrl, expectedState, codeVerifier) {
	const config = await getOidcConfig()

	// Exchange code for tokens (validates state, PKCE, and ID token)
	const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
		pkceCodeVerifier: codeVerifier,
		expectedState
	})

	// Extract claims from the ID token
	const claims = tokens.claims()

	let email = claims?.[oidcEmailClaim] ?? null
	let emailVerified = false
	let username = claims?.[oidcNameClaim] ?? null
	const sub = claims?.sub

	// Check if email is verified
	if (email) {
		emailVerified = !!claims?.email_verified
	}

	// If we have a userinfo endpoint and missing data, try fetching from there
	if ((!email || !username) && tokens.access_token) {
		try {
			const userinfo = await client.fetchUserInfo(config, tokens.access_token, sub)
			if (!email && userinfo?.[oidcEmailClaim]) {
				email = userinfo[oidcEmailClaim]
				emailVerified = !!userinfo?.email_verified
			}
			if (!username && userinfo?.[oidcNameClaim]) {
				username = userinfo[oidcNameClaim]
			}
		} catch {
			// userinfo fetch is optional, continue without it
			console.warn('[OIDC] Userinfo fetch failed, continuing with ID token claims only')
		}
	}

	return {
		email: typeof email === 'string' ? email : null,
		username: typeof username === 'string' ? username : null,
		sub: String(sub),
		emailVerified
	}
}

/**
 * Reset the cached configuration (useful for testing or after config changes).
 */
export function resetOidcConfig() {
	_config = null
	_configPromise = null
}
