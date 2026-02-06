/**
 * Generic OIDC (OpenID Connect) provider for custom identity providers.
 *
 * Supports self-hosted providers like Authentik, Keycloak, etc.
 * Uses openid-client v6 for discovery, PKCE, token validation.
 *
 * Configuration via environment variables:
 * - OIDC_ISSUER_URL: OIDC discovery URL (required)
 * - OIDC_CLIENT_ID: Client ID (required)
 * - OIDC_CLIENT_SECRET: Client secret (required)
 * - OIDC_NAME: Display name for login button (default: "OIDC")
 * - OIDC_EMAIL_CLAIM: Claim for email (default: "email")
 * - OIDC_NAME_CLAIM: Claim for username (default: "preferred_username")
 * - OIDC_SCOPES: Space-separated scopes (default: "openid email profile")
 *
 * @module oidc
 */

import * as client from 'openid-client'
import { env } from '$env/dynamic/private'
import { prisma } from '$lib/server/prisma.js'
import { auth } from '$lib/server/lucia.js'

const OIDC_ISSUER_URL = env.OIDC_ISSUER_URL?.trim()
const OIDC_CLIENT_ID = env.OIDC_CLIENT_ID?.trim()
const OIDC_CLIENT_SECRET = env.OIDC_CLIENT_SECRET?.trim()
const OIDC_NAME = env.OIDC_NAME?.trim() || 'OIDC'
const OIDC_EMAIL_CLAIM = env.OIDC_EMAIL_CLAIM?.trim() || 'email'
const OIDC_NAME_CLAIM = env.OIDC_NAME_CLAIM?.trim() || 'preferred_username'
const OIDC_SCOPES = env.OIDC_SCOPES?.trim() || 'openid email profile'
const BASE = env.ORIGIN?.trim()?.replace(/\/$/, '')

const PROVIDER_ID = 'oidc'
const REDIRECT_URI = BASE ? `${BASE}/api/oauth/callback` : null

/**
 * Whether the OIDC provider is configured with the minimum required env vars.
 *
 * @returns {boolean}
 */
export function isOidcConfigured() {
	return !!(OIDC_ISSUER_URL && OIDC_CLIENT_ID && OIDC_CLIENT_SECRET && BASE)
}

/**
 * Get the display name for the OIDC provider (for UI buttons).
 *
 * @returns {string}
 */
export function getOidcName() {
	return OIDC_NAME
}

// --- lazy-initialised Configuration singleton ---
/** @type {import('openid-client').Configuration | null} */
let _config = null
/** @type {Promise<import('openid-client').Configuration> | null} */
let _configPromise = null

/**
 * Lazily discover and cache the OIDC configuration.
 * Uses openid-client discovery to fetch .well-known/openid-configuration.
 *
 * @returns {Promise<import('openid-client').Configuration>}
 * @throws {Error} If discovery fails
 */
async function getConfig() {
	if (_config) return _config
	if (_configPromise) return _configPromise

	_configPromise = (async () => {
		const issuerUrl = new URL(OIDC_ISSUER_URL)

		// Determine discovery options — allow HTTP for local dev issuers
		const isHttpIssuer = issuerUrl.protocol === 'http:'
		const discoveryOptions = isHttpIssuer ? { execute: [client.allowInsecureRequests] } : undefined

		const config = await client.discovery(
			issuerUrl,
			OIDC_CLIENT_ID,
			OIDC_CLIENT_SECRET,
			undefined, // use default ClientSecretPost auth
			discoveryOptions
		)

		_config = config
		return config
	})()

	try {
		return await _configPromise
	} catch (err) {
		// Reset so next attempt retries discovery
		_configPromise = null
		throw err
	}
}

/**
 * OIDC provider adapter that matches the interface expected by the
 * existing OAuth authorization & callback routes.
 *
 * Lucia's built-in providers expose:
 *   getAuthorizationUrl() → [URL, state, codeVerifier?]
 *   validateCallback(code, codeVerifier?) → ProviderAdapter
 *
 * This adapter replicates that contract using openid-client v6.
 */
export const oidcAuth = isOidcConfigured()
	? {
			/**
			 * Build the authorization URL with PKCE + state.
			 *
			 * @returns {Promise<[URL, string, string]>} [authUrl, state, codeVerifier]
			 */
			async getAuthorizationUrl() {
				const config = await getConfig()

				const state = client.randomState()
				const codeVerifier = client.randomPKCECodeVerifier()
				const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier)

				const authUrl = client.buildAuthorizationUrl(config, {
					redirect_uri: REDIRECT_URI,
					scope: OIDC_SCOPES,
					state,
					code_challenge: codeChallenge,
					code_challenge_method: 'S256',
					response_type: 'code'
				})

				return [authUrl, state, codeVerifier]
			},

			/**
			 * Exchange the authorization code for tokens and return a
			 * provider-adapter object compatible with Lucia's pattern.
			 *
			 * @param {string} code  - authorization code from callback
			 * @param {string|null} codeVerifier - PKCE verifier stored in cookie
			 * @param {URL} currentUrl - the full callback URL (for openid-client validation)
			 * @param {string} expectedState - the state value from cookie
			 * @returns {Promise<OidcProviderAdapter>}
			 */
			async validateCallback(code, codeVerifier, currentUrl, expectedState) {
				const config = await getConfig()

				// openid-client v6 extracts code/state from the currentUrl automatically
				const tokens = await client.authorizationCodeGrant(config, currentUrl, {
					pkceCodeVerifier: codeVerifier || undefined,
					expectedState: expectedState || undefined
				})

				// Extract claims from id_token if present
				const idClaims = tokens.claims() || {}

				// Fetch userinfo for additional claims if available
				let userInfo = {}
				if (tokens.access_token) {
					try {
						userInfo = await client.fetchUserInfo(
							config,
							tokens.access_token,
							idClaims.sub || client.skipSubjectCheck
						)
					} catch {
						// userinfo endpoint may not be available; rely on id_token claims
					}
				}

				// Merge claims: userinfo takes precedence for profile data
				const merged = { ...idClaims, ...userInfo }

				const sub = String(merged.sub || '')
				const email = merged[OIDC_EMAIL_CLAIM] || null
				const emailVerified = !!(merged.email_verified ?? false)
				const nameValue =
					merged[OIDC_NAME_CLAIM] || merged.name || merged.preferred_username || null

				return new OidcProviderAdapter({
					sub,
					email: emailVerified ? email : null,
					unverifiedEmail: !emailVerified ? email : null,
					name: nameValue,
					accessToken: tokens.access_token
				})
			}
		}
	: null

/**
 * Adapter returned by validateCallback that mirrors Lucia OAuth's
 * provider-adapter interface (getExistingUser, createUser, createKey).
 */
class OidcProviderAdapter {
	/** @param {{ sub: string, email: string|null, unverifiedEmail: string|null, name: string|null, accessToken: string }} userData */
	constructor(userData) {
		/** User data extracted from OIDC claims */
		this.oidcUser = userData
	}

	/**
	 * Check if this OIDC identity is already linked to a local user.
	 *
	 * @returns {Promise<import('lucia').User|null>}
	 */
	async getExistingUser() {
		const existing = await prisma.authAccount.findUnique({
			where: {
				provider_id_provider_user_id: {
					provider_id: PROVIDER_ID,
					provider_user_id: this.oidcUser.sub
				}
			},
			include: { auth_user: true }
		})
		if (!existing) return null
		return auth.transformDatabaseUser(existing.auth_user)
	}

	/**
	 * Create a new local user and link the OIDC identity.
	 *
	 * @param {{ attributes: Record<string, any> }} opts
	 * @returns {Promise<import('lucia').User>}
	 */
	async createUser({ attributes }) {
		const userId = crypto.randomUUID()

		const dbUser = await prisma.authUser.create({
			data: {
				id: userId,
				...attributes
			}
		})

		// Create the AuthAccount link
		await prisma.authAccount.create({
			data: {
				id: `${PROVIDER_ID}:${this.oidcUser.sub}`,
				provider_id: PROVIDER_ID,
				provider_user_id: this.oidcUser.sub,
				user_id: userId
			}
		})

		return auth.transformDatabaseUser(dbUser)
	}

	/**
	 * Link this OIDC identity to an existing local user (email match).
	 *
	 * @param {string} userId - existing user ID to link to
	 * @returns {Promise<void>}
	 */
	async createKey(userId) {
		await prisma.authAccount.create({
			data: {
				id: `${PROVIDER_ID}:${this.oidcUser.sub}`,
				provider_id: PROVIDER_ID,
				provider_user_id: this.oidcUser.sub,
				user_id: userId
			}
		})
	}
}
