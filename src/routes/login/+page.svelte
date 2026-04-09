<script>
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Oauth from '$lib/components/auth/Oauth.svelte'
	import { onMount } from 'svelte'
	import { enhance } from '$app/forms'
	import { t } from '$lib/stores/locale.js'

	/** @type {{data: any}} */
	let { data, form } = $props()

	let settings = $derived(data.settings)
	let oauth = $derived(data.oauth)
	let registrationAllowed = $derived(settings.registrationAllowed)
	let oauthEnabled = $derived(oauth.oauthEnabled)
	let googleEnabled = $derived(oauth.googleEnabled)
	let githubEnabled = $derived(oauth.githubEnabled)
	let oidcEnabled = $derived(oauth.oidcEnabled)
	let oidcName = $derived(oauth.oidcName ?? 'OIDC')

	// messages
	let flashMessageCode = $derived(data.messageCode)
	let actionMessageCode = $derived(form?.messageCode)
	let actionMessage = $derived(form?.message)
	let errorMessageCode = $derived(actionMessageCode ?? flashMessageCode)

	let submitting = $state(false)

	onMount(() => {
		// strip the query param if we had a flash message
		if (flashMessageCode) {
			history.replaceState({}, '', '/login')
		}
	})
</script>

<div class="flex justify-center items-start min-h-[80vh] pt-8">
	<div class="card w-full max-w-md bg-base-200 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-3xl">{$t('nav.login')}</h2>
			<p class="text-base-content/70 mb-4">{$t('auth.welcomeBack')}</p>

			<form
				method="POST"
				class="space-y-4"
				use:enhance={() => {
					submitting = true
					return async ({ update }) => {
						await update()
						submitting = false
					}
				}}
			>
				<Input
					type="text"
					id="identifier"
					placeholder="jgcooks or griggers@cooksmail.com"
					name="identifier"
					label={$t('auth.usernameOrEmail')}
					required
				/>
				<Input
					type="password"
					id="password"
					placeholder="123grigsyruleZ"
					name="password"
					label={$t('auth.password')}
					required
				/>

				<div class="card-actions justify-end mt-6">
					<Button type="submit" class="w-full" loading={submitting} disabled={submitting}
						>{$t('auth.loginBtn')}</Button
					>
				</div>
			</form>

			<FeedbackMessage
				message={actionMessage}
				messageCode={errorMessageCode}
				type="error"
				inline={true}
			/>

			<div class="divider"></div>

			{#if registrationAllowed}
				<p class="text-center">
					{$t('auth.noAccount')}
					<a href="/register" class="link link-primary">{$t('nav.register')}</a>
				</p>
			{/if}

			{#if oauthEnabled}
				<Oauth {googleEnabled} {githubEnabled} {oidcEnabled} {oidcName} layout="column" />
				{#if !registrationAllowed}
					<p class="text-sm text-base-content/60 text-center mt-4">
						{$t('auth.registrationDisabled')}
					</p>
				{/if}
			{/if}
		</div>
	</div>
</div>
