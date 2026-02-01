<script>
	import { localDateAndTime } from '$lib/utils/dateTime'
	import { collectSelectedUids } from '$lib/utils/categories'

	import CategoryTree from '$lib/components/category/CategoryTree.svelte'
	import StarRating from '$lib/components/ui/StarRating.svelte'
	import InfoText from '$lib/components/ui/InfoText.svelte'

	/** @type {{recipe: any, categories: any}} */
	let { recipe, categories, recipeRatingChanged, scaledServings, useCats = 'false' } = $props()
</script>

<div class="card bg-base-300 shadow-md p-6">
	<h1 class="text-3xl md:text-4xl font-bold mb-4">{recipe?.name}</h1>

	<InfoText class="my-2"
		>Created: <span class="italic">{localDateAndTime(recipe.created)}</span></InfoText>

	{#if recipe?.source || recipe?.source_url || recipe?.parentRecipeId}
		<InfoText class="my-2">
			{#if recipe?.source && recipe?.source_url}
				Source:
				<a
					href={recipe.source_url}
					target="_blank"
					rel="noopener noreferrer"
					class="link link-primary">{recipe.source}</a>
			{:else if recipe?.source}
				Source: {recipe.source}
			{:else if recipe?.source_url}
				<a
					href={recipe.source_url}
					target="_blank"
					rel="noopener noreferrer"
					class="link link-primary">Source</a>
			{/if}
			{#if recipe?.parentRecipeId}
				<span class="mx-1 text-base-content/60">|</span>
				<a href={`/recipe/${recipe.parentRecipeId}/view/`} class="link link-primary">
					Forked From {recipe.parentRecipe?.name ?? 'Recipe'}
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
		<p class="text-base font-medium my-2">Servings: {scaledServings}</p>
	{/if}

	{#if useCats}
		<div class="mt-4">
			<CategoryTree {categories} selectedCategoryUids={collectSelectedUids(categories)} />
		</div>
	{/if}
</div>
