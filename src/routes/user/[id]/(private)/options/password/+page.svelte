<script>
	import { goto } from '$app/navigation'
	import { validatePassword } from '$lib/utils/security.js'
	import Button from '$lib/components/ui/Button.svelte'
	import Container from '$lib/components/ui/Container.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'

	let oldPass = $state(''),
		newPass = $state(''),
		newPassConfirm = $state('')

	/** @type {{data: any}} */
	let { data } = $props()

	const { user } = $state(data)
	let feedbackMessage = $state('')

	let passwordsMismatch = $derived(newPass !== newPassConfirm && newPass && newPassConfirm)

	// Validate the new password
	let newPasswordValidation = $derived(newPass.length > 0 ? validatePassword(newPass) : null)

	// Disable submit button if validation fails
	let isSubmitDisabled = $derived(
		!oldPass ||
		!newPass ||
		!newPassConfirm ||
		passwordsMismatch ||
		(newPasswordValidation && !newPasswordValidation.isValid)
	)

	async function updatePassword(event) {
		event.preventDefault()

		if (passwordsMismatch) {
			feedbackMessage = "Passwords don't match!"
			return
		}

		if (newPasswordValidation && !newPasswordValidation.isValid) {
			feedbackMessage = newPasswordValidation.message
			return
		}

		const response = await fetch(`/api/user/${user.userId}/password`, {
			// replace [user-id] with actual user id
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				oldPass,
				newPass,
				newPassConfirm
			})
		})

		if (response.ok) {
			// Handle success
			feedbackMessage = 'Password updated successfully!'
			// Clear form fields
			oldPass = ''
			newPass = ''
			newPassConfirm = ''
		} else {
			// Parse JSON for error responses
			try {
				const responseData = await response.json()
				if (response.status === 401) {
					// Old password incorrect or password validation failed
					feedbackMessage = responseData.error || 'Old password is incorrect!'
				} else {
					// Generic error for any server-side validation that was bypassed
					feedbackMessage = 'There was a problem updating your password!'
				}
			} catch (e) {
				// If JSON parsing fails, show generic error
				feedbackMessage = 'There was a problem updating your password!'
			}
		}
	}
</script>

<h3>Update Password</h3>
<Container>
	<form onsubmit={updatePassword}>
		<Input type="password" id="old" label="Old Password" bind:value={oldPass} />
		<Input type="password" id="new" label="New Password" bind:value={newPass} />
		{#if newPasswordValidation && newPasswordValidation.message}
			<p class="validation-message" class:valid={newPasswordValidation.isValid}>
				{newPasswordValidation.message}
			</p>
		{/if}
		<Input type="password" id="confirm" label="Confirm New Password" bind:value={newPassConfirm} />
		{#if passwordsMismatch}
			<p class="validation-message error">Passwords don't match!</p>
		{/if}
		<Button type="submit" disabled={isSubmitDisabled}>Update Password</Button>
	</form>
	{#if feedbackMessage}
		<p class="feedback">{feedbackMessage}</p>
	{/if}
</Container>

<style>
	.validation-message {
		margin-top: -0.75rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.validation-message.valid {
		color: var(--pico-ins-color);
	}

	.validation-message.error {
		color: var(--pico-del-color);
	}
</style>
