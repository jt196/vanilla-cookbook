<script>
	import { enhance } from '$app/forms'
	import { validatePassword } from '$lib/utils/security.js'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import Oauth from '$lib/components/Oauth.svelte'

	let { data, form } = $props()

	const { oauth } = $state(data)

	let { oauthEnabled, googleEnabled, githubEnabled } = $state(oauth)

	let errorMessage = $derived(form?.message)

	let username = $state('')
	let email = $state('')
	let password = $state('')
	let passwordConfirm = $state('')
	let seedRecipes = $state(true)

	// Email validation - simple but effective regex
	let emailValid = $derived(email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))

	// Password validation
	let passwordValidation = $derived(password.length > 0 ? validatePassword(password) : null)

	// Password match validation
	let passwordsMismatch = $derived(
		password.length > 0 && passwordConfirm.length > 0 && password !== passwordConfirm
	)

	// Disable submit if any validation fails
	let isSubmitDisabled = $derived(
		!username ||
		!email ||
		!emailValid ||
		!password ||
		!passwordConfirm ||
		passwordsMismatch ||
		(passwordValidation && !passwordValidation.isValid)
	)
</script>

<div class="auth-form">
	<form
		method="POST"
		use:enhance={() => {
			return async ({ update }) => {
				await update()
			}
		}}>
		<hgroup>
			<h2>Register</h2>
			<h3>To post articles, you'll need an account.</h3>
		</hgroup>

		<label for="username">Username</label>
		<input type="text" id="username" name="username" bind:value={username} required />

		<label for="email">Email</label>
		<input type="email" id="email" name="email" bind:value={email} required />
		{#if email.length > 0 && !emailValid}
			<p class="validation-message error">Please enter a valid email address.</p>
		{/if}

		<label for="password">Password</label>
		<input type="password" id="password" name="password" bind:value={password} required />
		{#if passwordValidation && passwordValidation.message}
			<p class="validation-message" class:valid={passwordValidation.isValid}>
				{passwordValidation.message}
			</p>
		{/if}

		<label for="passwordConfirm">Confirm Password</label>
		<input
			type="password"
			id="passwordConfirm"
			name="passwordConfirm"
			bind:value={passwordConfirm}
			required />
		{#if passwordsMismatch}
			<p class="validation-message error">Passwords don't match!</p>
		{/if}

		<label>
			<input type="checkbox" name="seedRecipes" bind:checked={seedRecipes} />
			Seed my account with 3 example recipes
		</label>

		<button type="submit" disabled={isSubmitDisabled}>Register</button>
	</form>
	<p>Already have an account? <a href="/login">Login</a></p>
	{#if oauthEnabled}
		<hr />
		<Oauth {googleEnabled} {githubEnabled} layout="column" />
	{/if}

	<FeedbackMessage message={errorMessage} type="error" />
</div>

<style>
	.validation-message {
		margin-top: -0.75rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.validation-message.valid {
		color: var(--pico-ins-color);
	}

	.validation-message:not(.valid) {
		color: var(--pico-del-color);
	}
</style>
