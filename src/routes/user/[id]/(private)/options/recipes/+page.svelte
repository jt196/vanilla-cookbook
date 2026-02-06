<script>
	import { systems, languages } from '$lib/utils/config.js'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import Dropdown from '$lib/components/ui/Form/Dropdown.svelte'

	/** @type {{data: any}} */
	let { data } = $props()
	const { user } = $state(data)
	let settingsFeedback = $state('')

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
			settingsFeedback = 'Recipe settings updated successfully!'
		} else {
			settingsFeedback = 'There was a problem updating your settings!'
		}
	}
</script>

<form
	method="POST"
	action="?/updateSettings"
	onsubmit={updateSettings}
	class="flex flex-col gap-4 w-full md:w-2/3 lg:w-1/2"
>
	<Dropdown
		name="language"
		options={languages}
		bind:selected={user.language}
		legend="Select language"
	/>
	<Dropdown
		name="system"
		options={systems}
		bind:selected={user.units}
		legend="Select measurement system"
	/>
	<Checkbox
		name="Skip Small"
		bind:checked={user.skipSmallUnits}
		legend="Skip Small Units"
		size="sm"
		color="neutral"
	>
		Use teaspoons and tablespoons instead of grams.
	</Checkbox>
	<Checkbox
		name="Cup Match"
		bind:checked={user.ingMatch}
		size="sm"
		color="neutral"
		legend="Display Cup Match"
	>
		volumetric ingredients by default when converting to and from US Cups
	</Checkbox>
	<Checkbox
		name="Display Original"
		bind:checked={user.ingOriginal}
		size="sm"
		color="neutral"
		legend="Display Original"
	>
		ingredient line text instead of parsed text
	</Checkbox>
	<Checkbox
		name="Display Symbols"
		bind:checked={user.ingSymbol}
		size="sm"
		color="neutral"
		legend="Display Symbols"
	>
		Display short form instead of long form units. e.g. g vs grams
	</Checkbox>
	<Checkbox
		name="Display Extra"
		bind:checked={user.ingExtra}
		size="sm"
		color="neutral"
		legend="Display Extra"
	>
		ingredient text, eg after the comma in "1 clove garlic, chopped"
	</Checkbox>
	<Checkbox
		name="Use Categories"
		bind:checked={user.useCats}
		size="sm"
		color="neutral"
		legend="Use Categories"
	>
		enables the user to filter by category.
	</Checkbox>
	<footer>
		<Button type="submit">Update</Button>
		<FeedbackMessage message={settingsFeedback} />
	</footer>
</form>
