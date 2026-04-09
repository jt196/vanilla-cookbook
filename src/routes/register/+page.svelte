<script>
	import { enhance } from '$app/forms'
	import { validatePasswords, validateEmail, buildPasswordEnv } from '$lib/utils/security.js'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import ValidationMessage from '$lib/components/ui/Form/ValidationMessage.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Oauth from '$lib/components/auth/Oauth.svelte'
	import { t } from '$lib/stores/locale.js'

	let { data, form } = $props()

	const { oauth, passwordRequirements, passwordRequirementsDescription } = $state(data)

	let { oauthEnabled, googleEnabled, githubEnabled, oidcEnabled } = $state(oauth)
	let oidcName = $state(oauth.oidcName ?? 'OIDC')

	let username = $state('')
	let email = $state('')
	let password = $state('')
	let passwordConfirm = $state('')
	let seedRecipes = $state(true)

	const passwordEnv = $derived(buildPasswordEnv(passwordRequirements))

	// Email validation
	let emailValidation = $derived(email ? validateEmail(email) : null)

	// Password validation
	let passwordValidation = $derived(
		password || passwordConfirm ? validatePasswords(password, passwordConfirm, passwordEnv) : null
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
			<h2 class="card-title text-3xl">{$t('auth.registerBtn')}</h2>

			<form
				method="POST"
				class="space-y-4"
				use:enhance={() => {
					return async ({ update }) => {
						await update()
					}
				}}
			>
				<Input
					type="text"
					id="username"
					placeholder="jgcooks"
					name="username"
					bind:value={username}
					label={$t('auth.username')}
					required
				/>

				<div>
					<Input
						type="email"
						id="email"
						placeholder="griggers@cooksmail.com"
						name="email"
						bind:value={email}
						label={$t('auth.email')}
						required
					/>
					<ValidationMessage
						message={emailValidation?.message}
						messageCode={emailValidation?.messageCode}
						isValid={emailValidation?.isValid}
						isError={!emailValidation?.isValid}
						hidden={!emailValidation?.message}
					/>
				</div>

				<div>
					{#if passwordRequirementsDescription}
						<p class="text-sm text-base-content/70 mb-2">{passwordRequirementsDescription}</p>
					{/if}
					<Input
						type="password"
						id="password"
						placeholder=""
						name="password"
						bind:value={password}
						label={$t('auth.password')}
						required
					/>
				</div>

				<div>
					<Input
						type="password"
						id="passwordConfirm"
						name="passwordConfirm"
						bind:value={passwordConfirm}
						label={$t('auth.confirmPassword')}
						required
					/>
					<ValidationMessage
						message={passwordValidation?.message}
						messageCode={passwordValidation?.messageCode}
						messageVars={passwordValidation?.messageVars}
						isError={!passwordValidation?.isValid}
						isValid={passwordValidation?.isValid}
						hidden={!passwordValidation?.message}
					/>
				</div>

				<Checkbox
					name="seedRecipes"
					bind:checked={seedRecipes}
					legend={$t('admin.users.seedRecipes')}
					size="sm"
					color="primary"
				>
					{$t('auth.seedAccount')}</Checkbox
				>

				<div class="card-actions justify-end mt-6">
					<Button type="submit" disabled={isSubmitDisabled} class="w-full"
						>{$t('auth.registerBtn')}</Button
					>
				</div>
			</form>

			<FeedbackMessage
				message={form?.message}
				messageCode={form?.messageCode}
				messageVars={form?.messageVars}
				type="error"
				inline={true}
			/>

			<div class="divider"></div>

			<p class="text-center">
				{$t('auth.haveAccount')} <a href="/login" class="link link-primary">{$t('nav.login')}</a>
			</p>

			{#if oauthEnabled}
				<Oauth {googleEnabled} {githubEnabled} {oidcEnabled} {oidcName} layout="column" />
			{/if}
		</div>
	</div>
</div>
