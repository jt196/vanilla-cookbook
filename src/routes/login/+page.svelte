<script>
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'

	/** @type {{data: any}} */
	let { data, form } = $props()
	const { settings } = $state(data)
	let errorMessage = $state(form?.message)
</script>

{#if settings.registrationAllowed}
	<p>Don't have an account? <a href="/register">Register</a></p>
{/if}

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
{#if errorMessage}
	<FeedbackMessage message={errorMessage} type="error" />
{/if}
