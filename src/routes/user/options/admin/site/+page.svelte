<script>
	/** @type {{data: any}} */
	let { data } = $props();

	const { settings } = $state(data)

	let settingsFeedback = $state('')

	async function updateAdminSettings(event) {
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
	<form method="POST" action="?/updateAdminSettings" onsubmit={updateAdminSettings}>
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
