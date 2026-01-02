<script>
	import { enhance } from '$app/forms'
	import { validatePasswords, validateEmail } from '$lib/utils/security.js'
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

	// Email validation
	let emailValidation = $derived(email ? validateEmail(email) : null)

	// Password validation
	let passwordValidation = $derived(
		password || passwordConfirm ? validatePasswords(password, passwordConfirm) : null
	)

	// Disable submit if any validation fails
	let isSubmitDisabled = $derived(
		!username ||
			!email ||
			(emailValidation && !emailValidation.isValid) ||
			!password ||
			!passwordConfirm ||
			(passwordValidation && !passwordValidation.isValid)
	)
</script>

<div class="flex justify-center items-start min-h-[80vh] pt-8">
	<div class="card w-full max-w-md bg-base-200 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-3xl">Register</h2>
			<p class="text-base-content/70 mb-4">To post articles, you'll need an account.</p>

			<form
				method="POST"
				class="space-y-4"
				use:enhance={() => {
					return async ({ update }) => {
						await update()
					}
				}}>
				<Input
					type="text"
					id="username"
					placeholder="jgcooks"
					name="username"
					bind:value={username}
					label="Username"
					required />

				<div>
					<Input
						type="email"
						id="email"
						placeholder="griggers@cooksmail.com"
						name="email"
						bind:value={email}
						label="Email"
						required />
					<ValidationMessage
						message={emailValidation?.message}
						isValid={emailValidation?.isValid}
						isError={!emailValidation?.isValid}
						hidden={!emailValidation?.message} />
				</div>

				<div>
					<Input
						type="password"
						id="password"
						placeholder=""
						name="password"
						bind:value={password}
						label="Password"
						required />
					<ValidationMessage
						message={passwordValidation?.message}
						isValid={passwordValidation?.isValid}
						hidden={!passwordValidation?.message} />
				</div>

				<div>
					<Input
						type="password"
						id="passwordConfirm"
						name="passwordConfirm"
						bind:value={passwordConfirm}
						label="Confirm Password"
						required />
					<ValidationMessage
						message={passwordValidation?.message}
						isError={!passwordValidation?.isValid}
						isValid={passwordValidation?.isValid}
						hidden={!passwordValidation?.message} />
				</div>

				<Checkbox
					name="seedRecipes"
					bind:checked={seedRecipes}
					legend="Seed Recipes"
					size="sm"
					color="primary">
					Seed my account with 3 example recipes</Checkbox>

				<div class="card-actions justify-end mt-6">
					<Button type="submit" disabled={isSubmitDisabled} class="w-full">Register</Button>
				</div>
			</form>

			<FeedbackMessage message={errorMessage} type="error" inline={true} />

			<div class="divider"></div>

			<p class="text-center">
				Already have an account? <a href="/login" class="link link-primary">Login</a>
			</p>

			{#if oauthEnabled}
				<Oauth {googleEnabled} {githubEnabled} layout="column" />
			{/if}
		</div>
	</div>
</div>
