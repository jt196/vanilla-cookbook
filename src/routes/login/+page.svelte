<script>
	/** @type {{data: any}} */
	let { data } = $props()
	const { settings } = $state(data)
</script>

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
{#if settings.registrationAllowed}
	<p>Don't have an account? <a href="/register">Register</a></p>
{/if}
