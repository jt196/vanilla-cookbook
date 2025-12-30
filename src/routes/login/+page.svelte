<script>
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import Button from '$lib/components/ui/Button.svelte'
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

<div class="flex justify-center items-start min-h-[80vh] pt-8">
	<div class="card w-full max-w-md bg-base-200 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-3xl">Login</h2>
			<p class="text-base-content/70 mb-4">Welcome back!</p>

			<form method="POST" class="space-y-4">
				<Input type="text" id="identifier" name="identifier" label="Username or email" required />
				<Input type="password" id="password" name="password" label="Password" required />

				<div class="card-actions justify-end mt-6">
					<Button type="submit" class="w-full">Login</Button>
				</div>
			</form>

			<FeedbackMessage message={errorMessage} type="error" inline={true} />

			<div class="divider"></div>

			{#if registrationAllowed}
				<p class="text-center">
					Don't have an account? <a href="/register" class="link link-primary">Register</a>
				</p>
			{/if}

			{#if oauthEnabled}
				<Oauth {googleEnabled} {githubEnabled} layout="column" />
				{#if !registrationAllowed}
					<p class="text-sm text-base-content/60 text-center mt-4">
						New account sign-ups are disabled. You can still sign in with an existing account.
					</p>
				{/if}
			{/if}
		</div>
	</div>
</div>
