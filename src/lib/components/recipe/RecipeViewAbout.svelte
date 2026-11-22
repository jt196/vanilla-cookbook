<script>
	import { localDateAndTime } from '$lib/utils/dateTime'
	import StarRating from '$lib/components/ui/StarRating.svelte'
	import InfoText from '$lib/components/ui/InfoText.svelte'
	import { durationToText } from '$lib/utils/parse/parseHelpers'
	import { langToBcp47 } from '$lib/i18n/index.js'
	import { t, langStore } from '$lib/stores/locale.js'

	/** @type {{recipe: any, recipeRatingChanged?: (rating: number) => void, scaledServings?: any, canRate?: boolean}} */
	let { recipe, recipeRatingChanged, scaledServings, canRate = false } = $props()

	// Prep/cook/total times that are set; imports may store ISO 8601 durations, shown as text
	const times = $derived(
		[
			['recipe.prepTime', recipe?.prep_time],
			['recipe.cookTime', recipe?.cook_time],
			['recipe.totalTime', recipe?.total_time]
		]
			.filter(([, value]) => value?.trim())
			.map(([key, value]) => ({
				key,
				value: durationToText(value.trim(), langToBcp47($langStore))
			}))
	)
</script>

<div class="card bg-base-300 shadow-md p-6">
	<h1 class="text-3xl md:text-4xl font-bold mb-4">{recipe?.name}</h1>

	<InfoText class="my-2"
		>{$t('recipe.created')}
		<span class="italic">{localDateAndTime(recipe.created)}</span></InfoText>

	{#if recipe?.source || recipe?.source_url || recipe?.parentRecipeId}
		<InfoText class="my-2">
			{#if recipe?.source && recipe?.source_url}
				{$t('recipe.sourceLabel')}
				<a
					href={recipe.source_url}
					target="_blank"
					rel="noopener noreferrer"
					class="link link-primary">{recipe.source}</a>
			{:else if recipe?.source}
				{$t('recipe.sourceLabel')} {recipe.source}
			{:else if recipe?.source_url}
				<a
					href={recipe.source_url}
					target="_blank"
					rel="noopener noreferrer"
					class="link link-primary">{$t('recipe.source')}</a>
			{/if}
			{#if recipe?.parentRecipeId}
				<span class="mx-1 text-base-content/60">|</span>
				<a href={`/recipe/${recipe.parentRecipeId}/view/`} class="link link-primary">
					{$t('recipe.forkedFrom', { name: recipe.parentRecipe?.name ?? 'Recipe' })}
				</a>
			{/if}
		</InfoText>
	{/if}

	<div class="my-2">
		<StarRating
			rating={recipe.rating}
			editable={canRate}
			ratingChanged={(newRating) => {
				recipeRatingChanged?.(newRating)
			}} />
	</div>

	{#if scaledServings}
		<p class="text-base font-medium my-2">{$t('recipe.servingsLabel')} {scaledServings}</p>
	{/if}

	{#if times.length}
		<div class="flex flex-wrap gap-x-6 gap-y-1 my-2">
			{#each times as time (time.key)}
				<p class="text-base font-medium">{$t(time.key)}: {time.value}</p>
			{/each}
		</div>
	{/if}
</div>
