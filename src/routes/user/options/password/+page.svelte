<script>
	import { goto } from '$app/navigation'
	let oldPass, newPass, newPassConfirm

	export let data

	const { user } = data
	let feedbackMessage = ''

	$: passwordsMismatch = newPass !== newPassConfirm && newPass && newPassConfirm

	async function updatePassword(event) {
		event.preventDefault()

		if (passwordsMismatch) {
			feedbackMessage = "Passwords don't match!"
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

		const responseData = await response.json()

		if (response.ok) {
			// Handle success
			console.log(responseData.message)
			feedbackMessage = 'Password Updated!'
			// Wait for 3 seconds before redirecting to the login page
			setTimeout(() => {
				goto('/login')
			}, 2000)
		} else if (response.status === 401) {
			feedbackMessage = 'Old Password Incorrect!'
		} else {
			// Handle error
			console.error(responseData.error)
			feedbackMessage = 'There was a problem updating your password!'
		}
	}
</script>

<h3>Update Password</h3>
<div class="container">
	<form action="?/updatePassword" method="POST" on:submit={updatePassword}>
		<label for="old"> Old Password </label>
		<input type="password" id="old" bind:value={oldPass} />
		<label for="new"> New Password </label>
		<input type="password" id="new" bind:value={newPass} />
		<label for="confirm"> Confirm New Password </label>
		<input type="password" id="confirm" bind:value={newPassConfirm} />
		<button type="submit">Update Password</button>
	</form>
	{#if feedbackMessage}
		<p class="feedback">{feedbackMessage}</p>
	{/if}
</div>
