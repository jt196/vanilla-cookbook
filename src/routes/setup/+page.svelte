<script>
	import { goto, invalidateAll } from '$app/navigation'
	import Spinner from '$lib/components/ui/Spinner.svelte'
	import { systems, languages } from '$lib/utils/config.js'
	import { validatePasswords, validateEmail, buildPasswordEnv } from '$lib/utils/security.js'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import Dropdown from '$lib/components/ui/Form/Dropdown.svelte'
	import ValidationMessage from '$lib/components/ui/Form/ValidationMessage.svelte'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import { t } from '$lib/stores/locale.js'

	let { data } = $props()
	const { passwordRequirements, passwordRequirementsDescription } = data

	const passwordEnv = $derived(buildPasswordEnv(passwordRequirements))

	let adminUsername = $state('')
	let adminUnits = $state('metric')
	let adminLanguage = $state('eng')
	let adminEmail = $state('')
	let adminPassword = $state('')
	let adminPasswordConfirm = $state('')
	let recipeSeed = $state('true')

	let spinnerVisible = $state(false)
	let setupFeedback = $state('')
	let setupFeedbackCode = $state(null)
	let setupFeedbackVars = $state({})

	let emailValidation = $derived(adminEmail ? validateEmail(adminEmail) : null)
	let passwordValidation = $derived(
		adminPassword || adminPasswordConfirm
			? validatePasswords(adminPassword, adminPasswordConfirm || adminPassword, passwordEnv)
			: null
	)

	let isSubmitDisabled = $derived(
		!adminUsername ||
			!adminEmail ||
			(emailValidation && !emailValidation.isValid) ||
			!adminPassword ||
			(passwordValidation && !passwordValidation.isValid)
	)

	async function handleSubmit(event) {
		event.preventDefault()
		spinnerVisible = true

		const formData = {
			adminUser: {
				adminUsername,
				adminEmail,
				adminPassword,
				adminLanguage,
				adminUnits,
				recipeSeed
			}
		}

		try {
			const res = await fetch('/api/site/seed', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			})
			const result = await res.json()
			if (res.ok && result.success) {
				spinnerVisible = false
				setupFeedback = ''
				setupFeedbackCode = result.code || null
				await invalidateAll()
				await goto(`/user/${result.id}/recipes`, { invalidateAll: true })
			} else {
				console.error('Error seeding DB:', result.error)
				setupFeedback = result.error || ''
				setupFeedbackCode = result.code || 'setup.msg.seedFailed'
				setupFeedbackVars = result.vars || {}
				spinnerVisible = false
			}
		} catch (error) {
			console.error('Error:', error)
			setupFeedback = ''
			setupFeedbackCode = 'setup.msg.seedFailed'
			spinnerVisible = false
		}
	}
</script>

<div class="flex justify-center items-start min-h-[80vh] pt-8">
	<div class="card w-full max-w-lg bg-base-200 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-3xl">{$t('setup.welcome')}</h2>
			<p class="text-base-content/70 mb-4">{$t('setup.subtitle')}</p>

			<form onsubmit={handleSubmit} method="POST" class="space-y-4">
				<Input
					type="text"
					id="username"
					placeholder="jgcooks"
					label={$t('auth.username')}
					bind:value={adminUsername}
					name="username"
					required
				/>
				<Input
					type="email"
					id="email"
					placeholder="griggers@cooksmail.com"
					label={$t('auth.email')}
					bind:value={adminEmail}
					name="email"
					required
				/>
				<ValidationMessage
					message={emailValidation?.message}
					messageCode={emailValidation?.messageCode}
					isValid={emailValidation?.isValid}
					isError={!emailValidation?.isValid}
					hidden={!emailValidation?.message}
				/>
				{#if passwordRequirementsDescription}
					<p class="text-sm text-base-content/70">{passwordRequirementsDescription}</p>
				{/if}
				<Input
					type="password"
					id="password"
					placeholder="123grigsyruleZ"
					label={$t('auth.password')}
					bind:value={adminPassword}
					name="password"
					required
				/>
				<Input
					type="password"
					id="passwordConfirm"
					placeholder="123grigsyruleZ"
					label={$t('auth.confirmPassword')}
					bind:value={adminPasswordConfirm}
					name="passwordConfirm"
					required
				/>
				<ValidationMessage
					message={passwordValidation?.message}
					messageCode={passwordValidation?.messageCode}
					messageVars={passwordValidation?.messageVars}
					isValid={passwordValidation?.isValid}
					isError={!passwordValidation?.isValid}
					hidden={!passwordValidation?.message}
				/>
				<FeedbackMessage
					message={setupFeedback}
					messageCode={setupFeedbackCode}
					messageVars={setupFeedbackVars}
					type="error"
					inline
				/>

				<Checkbox name="seedRecipes" bind:checked={recipeSeed} size="sm" color="primary">
					{$t('setup.addSampleRecipes')}</Checkbox
				>

				<Dropdown
					name="units"
					legend={$t('setup.units')}
					options={systems}
					bind:selected={adminUnits}
				/>

				<Dropdown
					name="language"
					legend={$t('setup.language')}
					options={languages}
					bind:selected={adminLanguage}
				/>

				<div class="card-actions justify-end mt-6">
					<Button type="submit" class="w-full" disabled={isSubmitDisabled}
						>{$t('setup.createAdmin')}</Button
					>
				</div>
			</form>
		</div>
	</div>
</div>

<Spinner visible={spinnerVisible} spinnerContent={$t('setup.creatingAdmin')} />
