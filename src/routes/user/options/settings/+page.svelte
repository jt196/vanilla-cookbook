<script>
	import { systems, languages } from '$lib/utils/units.js'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'

	/** @type {{data: any}} */
	let { data } = $props()
	const { user, dbRecCount } = $state(data)
	let settingsFeedback = $state('')

	let systemLabel = $derived(
		'Selected system: ' + systems.find((system) => system.value === user.units).label
	)

	let languageLabel = $derived(
		'Selected language: ' + languages.find((language) => language.value === user.language).label
	)

	$effect(() => {
		console.log(user.units)
	})

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
</script>

<div class="rec-count">
	You have {dbRecCount} recipes in your account.
	<br />
	Version: <i>{data.version}</i>
</div>

<form method="POST">
	<button id="logout" formaction="/logout" type="submit">Logout</button>
</form>

<form method="POST" action="?/updateSettings" onsubmit={updateSettings}>
	<h2>Ingredients</h2>
	<label>
		<input type="checkbox" name="Profile Public" bind:checked={user.skipSmallUnits} />
		Use teaspoons and tablespoons instead of grams.
	</label>
	<label>
		<input type="checkbox" name="Profile Public" bind:checked={user.ingMatch} />
		<b>Display Cup Match</b> volumetric ingredients by default when converting to and from US Cups
	</label>
	<label>
		<input type="checkbox" name="Profile Public" bind:checked={user.ingOriginal} />
		<b>Display Original</b> ingredient line text instead of parsed text
	</label>
	<label>
		<input type="checkbox" name="Profile Public" bind:checked={user.ingExtra} />
		<b>Display Extra</b> ingredient text, eg after the comma in "1 clove garlic, chopped"
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
		<details class="dropdown">
			<summary>{languageLabel}</summary>
			<ul>
				{#each languages as language}
					<li>
						<label>
							<input
								type="radio"
								bind:group={user.language}
								name="language"
								value={language.value}
								checked={language.value === user.language} />
							{language.label}
						</label>
					</li>
				{/each}
			</ul>
		</details>
	</label>
	<h2>Privacy</h2>
	<label>
		<input type="checkbox" name="Profile Public" bind:checked={user.publicProfile} />
		Profile Public
	</label>
	<label>
		<input type="checkbox" name="Recipes Public" bind:checked={user.publicRecipes} />
		Recipes Public
	</label>
	<footer>
		<button type="submit">Update</button>
		<FeedbackMessage message={settingsFeedback} />
	</footer>
</form>

<style>
	.dropdown {
		width: fit-content;
		margin: 1rem 0;
	}

	button {
		margin: 1rem 0;
	}
</style>
