<script>
	import { localDateAndTime } from '$lib/utils/dateTime'
	import StarRating from '$lib/components/ui/StarRating.svelte'
	import InfoText from '$lib/components/ui/InfoText.svelte'
	import { t } from '$lib/stores/locale.js'

	/** @type {{recipe: any}} */
	let { recipe, recipeRatingChanged, scaledServings } = $props()
</script>

<div class="card bg-base-300 shadow-md p-6">
	<h1 class="text-3xl md:text-4xl font-bold mb-4">{recipe?.name}</h1>

	<InfoText class="my-2"
		>{$t('recipe.created')} <span class="italic">{localDateAndTime(recipe.created)}</span></InfoText>

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
			editable={true}
			ratingChanged={(newRating) => {
				recipeRatingChanged?.(newRating)
			}} />
	</div>

	{#if scaledServings}
		<p class="text-base font-medium my-2">{$t('recipe.servingsLabel')} {scaledServings}</p>
	{/if}

</div>
