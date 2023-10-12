<script>
	export let data

	const { settings } = data

	let settingsFeedback = ''

	async function updateSettings(event) {
		event.preventDefault()
		const response = await fetch('/api/site', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(settings)
		})
		if (response.ok) {
			settingsFeedback = 'Settings updated successfully!'
		} else {
			settingsFeedback = 'There was a problem updating your settings!'
		}
	}
</script>

<h3>Update Site Settings</h3>
<div class="container">
	<form method="POST" action="?/updateSettings" on:submit={updateSettings}>
		<label>
			<input type="checkbox" name="Admin" bind:checked={settings.registrationAllowed} />
			Allow Registrations
		</label>
		<footer>
			<button type="submit">Update</button>
			{#if settingsFeedback}
				<p class="feedback">{settingsFeedback}</p>
			{/if}
		</footer>
	</form>
</div>

<style lang="scss">
	footer {
		margin-top: 1rem;
	}
</style>
