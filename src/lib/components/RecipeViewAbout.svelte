<script>
	import { localDateAndTime } from '$lib/utils/dateTime'
	import { collectSelectedUids } from '$lib/utils/categories'

	import CategoryTree from '$lib/components/CategoryTree.svelte'
	import StarRating from '$lib/components/StarRating.svelte'

	/** @type {{recipe: any, categories: any}} */
	let { recipe, categories, recipeRatingChanged, scaledServings, useCats = 'false' } = $props()
</script>

<div class="card bg-base-300 shadow-md p-6">
	<h1 class="text-3xl md:text-4xl font-bold mb-4">{recipe?.name}</h1>

	<p class="text-sm text-base-content/70 mb-2">
		Created: <span class="italic">{localDateAndTime(recipe.created)}</span>
	</p>

	{#if recipe?.source || recipe?.source_url}
		<p class="text-sm text-base-content/70 mb-4">
			{#if recipe?.source && recipe?.source_url}
				Source:
				<a href={recipe.source_url} target="_blank" rel="noopener noreferrer" class="link link-primary">{recipe.source}</a>
			{:else if recipe?.source}
				Source: {recipe.source}
			{:else if recipe?.source_url}
				<a href={recipe.source_url} target="_blank" rel="noopener noreferrer" class="link link-primary">Source</a>
			{/if}
		</p>
	{/if}

	<div class="mb-4">
		<StarRating
			rating={recipe.rating}
			editable={true}
			ratingChanged={(newRating) => {
				recipeRatingChanged?.(newRating)
			}} />
	</div>

	{#if scaledServings}
		<p class="text-base font-medium mb-4">Servings: {scaledServings}</p>
	{/if}

	{#if useCats}
		<div class="mt-4">
			<CategoryTree {categories} selectedCategoryUids={collectSelectedUids(categories)} />
		</div>
	{/if}
</div>
