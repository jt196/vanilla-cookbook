<script>
	import { goto } from '$app/navigation'
	import { validatePassword } from '$lib/utils/security.js'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Container from '$lib/components/ui/Container.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import ValidationMessage from '$lib/components/ui/Form/ValidationMessage.svelte'

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

<Container>
	<form onsubmit={updatePassword} class="flex flex-col gap-4 w-full md:w-1/2">
		<h3>Update Password</h3>
		<Input type="password" id="old" label="Old Password" bind:value={oldPass} />
		<Input type="password" id="new" label="New Password" bind:value={newPass} />
		<ValidationMessage
			message={newPasswordValidation?.message}
			isValid={newPasswordValidation?.isValid} />
		<Input type="password" id="confirm" label="Confirm New Password" bind:value={newPassConfirm} />
		<ValidationMessage
			message={passwordsMismatch ? "Passwords don't match!" : null}
			isError={true} />
		<Button type="submit" class="w-auto self-start" disabled={isSubmitDisabled}
			>Update Password</Button>
	</form>
	<FeedbackMessage message={feedbackMessage} inline />
</Container>
