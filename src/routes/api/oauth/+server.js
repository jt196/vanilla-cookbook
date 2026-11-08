// src/routes/api/oauth/+server.js
import { dev } from '$app/environment'
import { githubAuth, googleAuth } from '$lib/server/oauth.js'
import { oidcEnabled, getAuthorizationUrl as getOidcAuthUrl } from '$lib/server/oidc.js'

/**
 * Start an OAuth/OIDC login (`?provider=github|google|oidc`): store state in cookies and
 * redirect to the provider.
 *
 * @param {import('./$types').RequestEvent} event
 * @returns {Promise<Response>}
 */
export async function GET({ url, cookies }) {
	const provider = url.searchParams.get('provider')

	// OIDC flow uses a separate code path
	if (provider === 'oidc') {
		if (!oidcEnabled) return new Response('OIDC provider not configured', { status: 400 })

		try {
			const { url: authUrl, state, codeVerifier } = await getOidcAuthUrl()

			cookies.set('oauth_provider', 'oidc', {
				httpOnly: true,
				secure: !dev,
				path: '/',
				maxAge: 600
			})
			cookies.set('oauth_state', state, {
				httpOnly: true,
				secure: !dev,
				path: '/',
				maxAge: 600
			})
			cookies.set('oauth_code_verifier', codeVerifier, {
				httpOnly: true,
				secure: !dev,
				path: '/',
				maxAge: 600
			})

			return new Response(null, { status: 302, headers: { Location: authUrl.toString() } })
		} catch (err) {
			console.error('[OIDC] Authorization URL generation failed:', err)
			const msg = encodeURIComponent('auth.msg.oidcUnavailable')
			return new Response(null, {
				status: 302,
				headers: { Location: `/login?messageCode=${msg}` }
			})
		}
	}

	// GitHub / Google flow (existing)
	const authProvider =
		provider === 'github' ? githubAuth : provider === 'google' ? googleAuth : null
	if (!authProvider) return new Response('Invalid provider', { status: 400 })

	const [authUrl, state] = await authProvider.getAuthorizationUrl()

	cookies.set('oauth_provider', provider, {
		httpOnly: true,
		secure: !dev,
		path: '/',
		maxAge: 600
	})
	cookies.set('oauth_state', state, {
		httpOnly: true,
		secure: !dev,
		path: '/',
		maxAge: 600
	})
	return new Response(null, { status: 302, headers: { Location: authUrl.toString() } })
}
