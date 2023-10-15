<script>
	import { systems } from '$lib/utils/units.js'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'

	export let data
	const { user, dbRecCount } = data
	let settingsFeedback = ''
	let systemLabel
	$: console.log(user.units)

	async function updateSettings(event) {
		event.preventDefault()
		const response = await fetch(`/api/user/${user.userId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(user)
		})
		if (response.ok) {
			settingsFeedback = 'Settings updated successfully!'
		} else {
			settingsFeedback = 'There was a problem updating your settings!'
		}
	}

	// Display the selected system label
	$: systemLabel = 'Selected system: ' + systems.find((system) => system.value === user.units).label
</script>

<div class="rec-count">
	You have {dbRecCount} recipes in your account.
</div>
<br />

<form method="POST">
	<button id="logout" formaction="/logout" type="submit">Logout</button>
</form>

<form method="POST" action="?/updateSettings" on:submit={updateSettings}>
	<label>
		<input type="checkbox" name="Profile Public" bind:checked={user.publicProfile} />
		Profile Public
	</label>
	<label>
		<input type="checkbox" name="Recipes Public" bind:checked={user.publicRecipes} />
		Recipes Public
	</label>
	<details class="dropdown">
		<summary>{systemLabel}</summary>
		<ul>
			{#each systems as system}
				<li>
					<label>
						<input
							type="radio"
							bind:group={user.units}
							name="system"
							value={system.value}
							checked={system.value === user.units} />
						{system.label}
					</label>
				</li>
			{/each}
		</ul>
	</details>
	<footer>
		<button type="submit">Update</button>
		<FeedbackMessage message={settingsFeedback} />
	</footer>
</form>
