<script>
	import { systems, languages } from '$lib/utils/config.js'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import Dropdown from '$lib/components/ui/Form/Dropdown.svelte'

	/** @type {{data: any}} */
	let { data } = $props()
	const { user, dbRecordCount } = $state(data)
	let settingsFeedback = $state('')

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
	You have {dbRecordCount} recipes in your account.
	<br />
	Version: <i>{data.version}</i>
</div>

<form method="POST">
	<Button id="logout" formaction="/logout" type="submit">Logout</Button>
</form>

<form method="POST" action="?/updateSettings" onsubmit={updateSettings}>
	<h2>Ingredients</h2>
	<Checkbox
		name="Skip Small"
		bind:checked={user.skipSmallUnits}
		label="Use teaspoons and tablespoons instead of grams."
		size="sm"
		color="neutral" />
	<Checkbox name="Cup Match" bind:checked={user.ingMatch} size="sm" color="neutral">
		<b>Display Cup Match</b> volumetric ingredients by default when converting to and from US Cups
	</Checkbox>
	<Checkbox name="Display Original" bind:checked={user.ingOriginal} size="sm" color="neutral">
		<b>Display Original</b> ingredient line text instead of parsed text
	</Checkbox>
	<Checkbox name="Display Symbols" bind:checked={user.ingSymbol} size="sm" color="neutral">
		<b>Display Symbols</b> Display short form instead of long form units. e.g. g vs grams
	</Checkbox>
	<Checkbox name="Display Extra" bind:checked={user.ingExtra} size="sm" color="neutral">
		<b>Display Extra</b> ingredient text, eg after the comma in "1 clove garlic, chopped"
	</Checkbox>
	<Checkbox name="Use Categories" bind:checked={user.useCats} size="sm" color="neutral">
		<b>Use Categories</b> enables the user to filter by category.
	</Checkbox>
	<Dropdown
		name="system"
		options={systems}
		bind:selected={user.units}
		label="Select measurement system" />
	<Dropdown
		name="language"
		options={languages}
		bind:selected={user.language}
		label="Select language" />
	<h2>Privacy</h2>
	<Checkbox
		name="Profile Public"
		bind:checked={user.publicProfile}
		label="Profile Public"
		size="sm"
		color="primary" />
	<Checkbox
		name="Recipes Public"
		bind:checked={user.publicRecipes}
		label="Recipes Public"
		size="sm"
		color="primary" />
	<footer>
		<Button type="submit">Update</Button>
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
