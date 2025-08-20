<script>
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import Oauth from '$lib/components/Oauth.svelte'

	/** @type {{data: any}} */
	let { data, form } = $props()
	const { oauth, settings } = $state(data)

	let { oauthEnabled, googleEnabled, githubEnabled } = $state(oauth)
	let { registrationAllowed } = $state(settings)

	let errorMessage = $state(form?.message)
</script>

<div class="auth-form">
	<form method="POST">
		<hgroup>
			<h2>Login</h2>
			<h3>Welcome back!</h3>
		</hgroup>
		<label for="username">Username</label>
		<input type="text" id="username" name="username" required />

		<label for="password">Password</label>
		<input type="password" id="password" name="password" required />

		<button type="submit">Login</button>
	</form>

	<FeedbackMessage message={errorMessage} type="error" />

	{#if registrationAllowed}
		<p>Don't have an account? <a href="/register">Register</a></p>
	{/if}

	{#if oauthEnabled && registrationAllowed}
		<hr />
		<Oauth {googleEnabled} {githubEnabled} layout="column" />
	{/if}
</div>
