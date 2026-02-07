// src/routes/api/oauth/+server.js
import { dev } from '$app/environment'
import { githubAuth, googleAuth } from '$lib/server/oauth.js'
import { oidcEnabled, getAuthorizationUrl as getOidcAuthUrl } from '$lib/server/oidc.js'

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
			const msg = encodeURIComponent('OIDC provider is not available. Please try again later.')
			return new Response(null, {
				status: 302,
				headers: { Location: `/login?message=${msg}` }
			})
		}
	}

	// GitHub / Google flow (existing)
	const authProvider =
		provider === 'github' ? githubAuth : provider === 'google' ? googleAuth : null
	if (!authProvider) return new Response('Invalid provider', { status: 400 })

	// Some providers (Google) return [url, state, codeVerifier]; others return [url, state]
	const res = await authProvider.getAuthorizationUrl()
	const [authUrl, state, codeVerifier] = res

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
	if (codeVerifier) {
		cookies.set('oauth_code_verifier', codeVerifier, {
			httpOnly: true,
			secure: !dev,
			path: '/',
			maxAge: 600
		})
	}

	return new Response(null, { status: 302, headers: { Location: authUrl.toString() } })
}
