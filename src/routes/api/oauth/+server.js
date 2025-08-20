// src/routes/api/oauth/+server.js
import { dev } from '$app/environment'
import { githubAuth, googleAuth } from '$lib/server/oauth.js'

export async function GET({ url, cookies }) {
	const provider = url.searchParams.get('provider')
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
