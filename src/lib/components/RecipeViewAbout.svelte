<script>
	import { localDateAndTime } from '$lib/utils/dateTime'
	import { collectSelectedUids } from '$lib/utils/categories'

	import CategoryTree from '$lib/components/CategoryTree.svelte'
	import StarRating from '$lib/components/StarRating.svelte'
	import InfoText from '$lib/components/ui/InfoText.svelte'

	/** @type {{recipe: any, categories: any}} */
	let { recipe, categories, recipeRatingChanged, scaledServings, useCats = 'false' } = $props()
</script>

<div class="card bg-base-300 shadow-md p-6">
	<h1 class="text-3xl md:text-4xl font-bold mb-4">{recipe?.name}</h1>

	<InfoText class="my-2"
		>Created: <span class="italic">{localDateAndTime(recipe.created)}</span></InfoText>

	{#if recipe?.source || recipe?.source_url}
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
