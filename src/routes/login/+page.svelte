<script>
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'

	/** @type {{data: any}} */
	let { data, form } = $props()
	const { settings, oauthEnabled, googleEnabled, githubEnabled } = $state(data)
	let errorMessage = $state(form?.message)
</script>

<style>
	.oauth-buttons {
		display: flex;
		gap: 1rem;
		flex-direction: column;
		max-width: 320px;
		margin: 1rem auto;
	}
	
	@media (max-width: 600px) {
		.oauth-buttons {
			max-width: 100%;
		}
	}
	
	.oauth-buttons a {
		display: flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
		width: 100%;
		margin: 0;
	}
</style>

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

<FeedbackMessage message={errorMessage} type="error" />

{#if oauthEnabled}
	<hr />
	<hgroup>
		<h3>Or sign in with</h3>
	</hgroup>
	<div class="oauth-buttons">
		{#if googleEnabled}
			<a href="/api/oauth?provider=google" class="button secondary">
				<!-- Google Icon SVG -->
				<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor" style="margin-right: 8px;">
					<path d="M17.64,9.2c0-0.79-0.07-1.54-0.19-2.27H9v4.06h4.87c-0.2,1.09-0.84,2.01-1.79,2.62v2.51h2.89C16.88,12.6,17.64,11.04,17.64,9.2z"/>
					<path d="M9,18c2.43,0,4.47-0.8,5.96-2.18l-2.89-2.51c-0.79,0.53-1.8,0.84-3.07,0.84c-2.36,0-4.36-1.59-5.07-3.68H0.71v2.59C2.27,15.95,5.22,18,9,18z"/>
					<path d="M3.93,10.68c-0.18-0.54-0.28-1.11-0.28-1.69c0-0.59,0.1-1.16,0.28-1.69V5.71H0.71C0.26,6.55,0,7.45,0,8.99c0,1.54,0.26,2.44,0.71,3.28L3.93,10.68L3.93,10.68z"/>
					<path d="M9,3.6c1.32,0,2.5,0.45,3.44,1.34l2.59-2.59C13.47,1.11,11.43,0,9,0C5.22,0,2.27,2.05,0.71,5.01l3.82,2.95C4.64,5.72,6.64,3.6,9,3.6z"/>
				</svg>
				Google
			</a>
		{/if}
		{#if githubEnabled}
			<a href="/api/oauth?provider=github" class="button secondary">
				<!-- GitHub Icon SVG -->
				<svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" style="margin-right: 8px;">
					<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
				</svg>
				GitHub
			</a>
		{/if}
	</div>
{/if}
