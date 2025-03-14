<script>
	import { localDateAndTime } from '$lib/utils/dateTime'
	import { collectSelectedUids } from '$lib/utils/categories'

	import CategoryTree from '$lib/components/CategoryTree.svelte'
	import StarRating from '$lib/components/StarRating.svelte'

	/** @type {{recipe: any, categories: any}} */
	let { recipe, categories, recipeRatingChanged, scaledServings } = $props()
</script>

<div class="recipe-about">
	<h1>{recipe?.name}</h1>

	<p>Created: <i>{localDateAndTime(recipe.created)}</i></p>
	<p>
		Source:
		<a href={recipe?.source_url}>{recipe?.source}</a>
	</p>
	<StarRating
		rating={recipe.rating}
		editable={true}
		ratingChanged={(newRating) => {
			recipeRatingChanged?.(newRating) // Call only if defined
		}} />
	<div id="scale">
		{#if scaledServings}
			<p>Servings: {scaledServings}</p>
		{/if}
	</div>
	<div id="categories">
		<CategoryTree {categories} selectedCategoryUids={collectSelectedUids(categories)} />
	</div>
</div>

<style lang="scss">
	.recipe-about {
		flex: 2;
		padding: 1rem;
		border-radius: 1rem;
		background: var(--pico-secondary-focus);
		#categories,
		#scale {
			margin-top: 1rem;
		}
	}
</style>
