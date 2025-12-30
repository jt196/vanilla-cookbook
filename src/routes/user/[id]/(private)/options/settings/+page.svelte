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

<div class="rec-count prose">
	You have {dbRecordCount} recipes in your account.
	<br />
	Version: <i>{data.version}</i>
</div>

<form method="POST">
	<Button id="logout" formaction="/logout" type="submit">Logout</Button>
</form>

<form method="POST" action="?/updateSettings" onsubmit={updateSettings}>
	<h2 class="prose mb-2">Ingredients</h2>
	<div class="flex flex-col gap-2 prose">
		<Checkbox
			name="Skip Small"
			bind:checked={user.skipSmallUnits}
			legend="Skip Small Units"
			size="sm"
			color="neutral">
			Use teaspoons and tablespoons instead of grams.
		</Checkbox>
		<Checkbox
			name="Cup Match"
			bind:checked={user.ingMatch}
			size="sm"
			color="neutral"
			legend="Display Cup Match">
			volumetric ingredients by default when converting to and from US Cups
		</Checkbox>
		<Checkbox
			name="Display Original"
			bind:checked={user.ingOriginal}
			size="sm"
			color="neutral"
			legend="Display Original">
			ingredient line text instead of parsed text
		</Checkbox>
		<Checkbox
			name="Display Symbols"
			bind:checked={user.ingSymbol}
			size="sm"
			color="neutral"
			legend="Display Symbols">
			Display short form instead of long form units. e.g. g vs grams
		</Checkbox>
		<Checkbox
			name="Display Extra"
			bind:checked={user.ingExtra}
			size="sm"
			color="neutral"
			legend="Display Extra">
			ingredient text, eg after the comma in "1 clove garlic, chopped"
		</Checkbox>
		<Checkbox
			name="Use Categories"
			bind:checked={user.useCats}
			size="sm"
			color="neutral"
			legend="Use Categories">
			enables the user to filter by category.
		</Checkbox>
	</div>
	<Dropdown
		name="system"
		options={systems}
		bind:selected={user.units}
		legend="Select measurement system" />
	<Dropdown
		name="language"
		options={languages}
		bind:selected={user.language}
		legend="Select language" />
	<h2 class="prose mb-2">Privacy</h2>
	<div class="flex flex-col gap-2">
		<Checkbox
			name="Profile Public"
			legend="Profile Public"
			bind:checked={user.publicProfile}
			label="Profile Public"
			size="sm"
			color="primary">
			Show or hide your profile from other users.
		</Checkbox>
		<Checkbox
			name="Recipes Public"
			bind:checked={user.publicRecipes}
			legend="Recipes Public"
			size="sm"
			color="primary">
			Make your recipes public or private by default
		</Checkbox>
		<footer>
			<Button type="submit">Update</Button>
			<FeedbackMessage message={settingsFeedback} />
		</footer>
	</div>
</form>
