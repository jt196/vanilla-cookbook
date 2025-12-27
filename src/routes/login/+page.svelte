<script>
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Oauth from '$lib/components/Oauth.svelte'
	import { onMount } from 'svelte'

	/** @type {{data: any}} */
	let { data, form } = $props()

	let settings = $derived(data.settings)
	let oauth = $derived(data.oauth)
	let registrationAllowed = $derived(settings.registrationAllowed)
	let oauthEnabled = $derived(oauth.oauthEnabled)
	let googleEnabled = $derived(oauth.googleEnabled)
	let githubEnabled = $derived(oauth.githubEnabled)

	// messages
	let flashMessage = $derived(data.message) // from URL (?message=...)
	let actionMessage = $derived(form?.message) // from action fail(...)
	let errorMessage = $derived(actionMessage ?? flashMessage ?? null)

	onMount(() => {
		// strip the query param if we had a flash message
		if (flashMessage) {
			history.replaceState({}, '', '/login')
		}
	})
</script>

<div class="auth-form">
	<form method="POST">
		<hgroup>
			<h2>Login</h2>
			<h3>Welcome back!</h3>
		</hgroup>
		<Input type="text" id="identifier" name="identifier" label="Username or email" required />
		<Input type="password" id="password" name="password" label="Password" required />

		<button type="submit">Login</button>
	</form>

	<FeedbackMessage message={errorMessage} type="error" />

	<hr />
	{#if registrationAllowed}
		<p>Don't have an account? <a href="/register">Register</a></p>
	{/if}

	{#if oauthEnabled}
		<Oauth {googleEnabled} {githubEnabled} layout="column" />
		<hr />
		{#if !registrationAllowed}
			<p class="muted">
				New account sign-ups are disabled. You can still sign in with an existing account.
			</p>
		{/if}
	{/if}
</div>
