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
		{user.skipSmallUnits
			? 'Use teaspoons and tablespoons instead of grams.'
			: 'Use grams for small measurements.'}
	</Checkbox>
	<Checkbox
		name="Volumetric Match Display"
		bind:checked={user.ingMatch}
		size="sm"
		color="neutral"
		legend="Volumetric Match Display"
	>
		{user.ingMatch
			? 'Display ingredient matching when converting to and from US Cups.'
			: 'Hide ingredient matching when converting to and from US Cups.'}
	</Checkbox>
	<Checkbox
		name="Display Original"
		bind:checked={user.ingOriginal}
		size="sm"
		color="neutral"
		legend="Display Original"
	>
		{user.ingOriginal
			? 'Display original ingredient line text.'
			: 'Display parsed ingredient text.'}
	</Checkbox>
	<Checkbox
		name="Display Symbols"
		bind:checked={user.ingSymbol}
		size="sm"
		color="neutral"
		legend="Display Symbols"
	>
		{user.ingSymbol
			? 'Display short-form units, e.g. g vs grams.'
			: 'Display long-form units, e.g. grams vs g.'}
	</Checkbox>
	<Checkbox
		name="Display Extra"
		bind:checked={user.ingExtra}
		size="sm"
		color="neutral"
		legend="Display Extra"
	>
		{user.ingExtra
			? 'Display extra ingredient text, e.g. after the comma in "1 clove garlic, chopped".'
			: 'Hide extra ingredient text.'}
	</Checkbox>
	<Checkbox
		name="Use Categories"
		bind:checked={user.useCats}
		size="sm"
		color="neutral"
		legend="Use Categories"
	>
		{user.useCats ? 'Category filtering is enabled.' : 'Category filtering is disabled.'}
	</Checkbox>
	<footer>
		<Button type="submit">Update</Button>
		<FeedbackMessage message={settingsFeedback} />
	</footer>
</form>
