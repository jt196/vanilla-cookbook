<script>
	import { systems, languages } from '$lib/utils/config.js'
	import { invalidateAll } from '$app/navigation'
	import FeedbackMessage from '$lib/components/ui/FeedbackMessage.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Checkbox from '$lib/components/ui/Form/Checkbox.svelte'
	import Dropdown from '$lib/components/ui/Form/Dropdown.svelte'
	import { t } from '$lib/stores/locale.js'

	/** @type {{data: any}} */
	let { data } = $props()
	const { user, semanticEnabled } = $state(data)
	let settingsFeedback = $state('')
	let savedLanguage = $state(user.language)

	$effect(() => {
		if (user && user.showNotesDescription === undefined) {
			user.showNotesDescription = true
		}
	})

	async function updateSettings(event) {
		event.preventDefault()
		const languageChanged = user.language !== savedLanguage
		const response = await fetch(`/api/user/${user.userId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(user)
		})
		if (response.ok) {
			settingsFeedback = 'recipePrefs.msg.updated'
			savedLanguage = user.language
			if (languageChanged) {
				await invalidateAll()
				window.location.reload()
			}
		} else {
			settingsFeedback = 'recipePrefs.msg.updateFail'
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
		legend={$t('recipePrefs.language')}
	/>
	<Dropdown
		name="system"
		options={systems}
		bind:selected={user.units}
		legend={$t('recipePrefs.system')}
	/>
	<Checkbox
		name="Skip Small"
		bind:checked={user.skipSmallUnits}
		legend={$t('recipePrefs.skipSmallUnits')}
		size="sm"
		color="neutral"
	>
		{user.skipSmallUnits ? $t('recipePrefs.skipSmallUnitsOn') : $t('recipePrefs.skipSmallUnitsOff')}
	</Checkbox>
	<Checkbox
		name="Volumetric Match Display"
		bind:checked={user.ingMatch}
		size="sm"
		color="neutral"
		legend={$t('recipePrefs.volumetricMatch')}
	>
		{user.ingMatch ? $t('recipePrefs.volumetricMatchOn') : $t('recipePrefs.volumetricMatchOff')}
	</Checkbox>
	<Checkbox
		name="Display Original"
		bind:checked={user.ingOriginal}
		size="sm"
		color="neutral"
		legend={$t('recipePrefs.displayOriginal')}
	>
		{user.ingOriginal ? $t('recipePrefs.displayOriginalOn') : $t('recipePrefs.displayOriginalOff')}
	</Checkbox>
	<Checkbox
		name="Display Symbols"
		bind:checked={user.ingSymbol}
		size="sm"
		color="neutral"
		legend={$t('recipePrefs.displaySymbols')}
	>
		{user.ingSymbol ? $t('recipePrefs.displaySymbolsOn') : $t('recipePrefs.displaySymbolsOff')}
	</Checkbox>
	<Checkbox
		name="Display Nutrition"
		bind:checked={user.displayNutrition}
		size="sm"
		color="neutral"
		legend={$t('recipePrefs.displayNutrition')}
	>
		{user.displayNutrition
			? $t('recipePrefs.displayNutritionOn')
			: $t('recipePrefs.displayNutritionOff')}
	</Checkbox>
	<div class={!semanticEnabled ? 'opacity-50' : ''}>
		<Checkbox
			name="showSimilarRecipes"
			bind:checked={user.showSimilarRecipes}
			size="sm"
			color="neutral"
			legend={$t('recipePrefs.similarRecipes')}
			disabled={!semanticEnabled}
		>
			{#if !semanticEnabled}
				{$t('recipePrefs.similarRecipesDisabled')}
			{:else if user.showSimilarRecipes}
				{$t('recipePrefs.similarRecipesOn')}
			{:else}
				{$t('recipePrefs.similarRecipesOff')}
			{/if}
		</Checkbox>
	</div>
	<Checkbox
		name="showNotesDescription"
		bind:checked={user.showNotesDescription}
		size="sm"
		color="neutral"
		legend={$t('recipePrefs.showNotesDescription')}
	>
		{user.showNotesDescription
			? $t('recipePrefs.showNotesDescriptionOn')
			: $t('recipePrefs.showNotesDescriptionOff')}
	</Checkbox>
	<Checkbox
		name="Display Extra"
		bind:checked={user.ingExtra}
		size="sm"
		color="neutral"
		legend={$t('recipePrefs.displayExtra')}
	>
		{user.ingExtra ? $t('recipePrefs.displayExtraOn') : $t('recipePrefs.displayExtraOff')}
	</Checkbox>
	<footer>
		<Button type="submit">{$t('common.update')}</Button>
		<FeedbackMessage message={settingsFeedback ? $t(settingsFeedback) : ''} />
	</footer>
</form>
