<script>
	import { enhance } from '$app/forms'
	import { validatePassword } from '$lib/utils/security.js'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import ValidationMessage from '$lib/components/ui/Form/ValidationMessage.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import Button from '$lib/components/ui/Button.svelte'
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

		<Input type="text" id="username" name="username" bind:value={username} label="Username" required />

		<Input type="email" id="email" name="email" bind:value={email} label="Email" required />
		<ValidationMessage
			message={email.length > 0 && !emailValid ? 'Please enter a valid email address.' : null}
			isError={true} />

		<Input type="password" id="password" name="password" bind:value={password} label="Password" required />
		<ValidationMessage
			message={passwordValidation?.message}
			isValid={passwordValidation?.isValid} />

		<Input type="password" id="passwordConfirm" name="passwordConfirm" bind:value={passwordConfirm} label="Confirm Password" required />
		<ValidationMessage message={passwordsMismatch ? "Passwords don't match!" : null} isError={true} />

		<Checkbox name="seedRecipes" bind:checked={seedRecipes} label="Seed my account with 3 example recipes" />

		<Button type="submit" disabled={isSubmitDisabled}>Register</Button>
	</form>
	<p>Already have an account? <a href="/login">Login</a></p>
	{#if oauthEnabled}
		<hr />
		<Oauth {googleEnabled} {githubEnabled} layout="column" />
	{/if}

	<FeedbackMessage message={errorMessage} type="error" />
</div>
