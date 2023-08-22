<script>
	import { localDateAndTime } from '$lib/utils/dateTime'
	import {
		decimalToFraction,
		ingredientProcess,
		scaleNumbersInString,
		startsWithHttp
	} from '$lib/utils/filters'
	import Scale from '$lib/components/Scale.svelte'
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'
	import CategoryTree from '$lib/components/CategoryTree.svelte'

	/**
	 * Data for the current page.
	 * @type {PageData}
	 */
	export let data

	let { recipe, categories } = data

	/**
	 * The list of ingredients in string format.
	 * @type {string[]}
	 */
	let ingredients = []

	/**
	 * The list of ingredients parsed into a structured format.
	 * @type {parsedIngredient[]}
	 */
	let ingredientsArray = []

	/**
	 * The scaling factor to adjust the quantity of the ingredients.
	 * @type {number}
	 */
	let scale = 1

	/**
	 * Scaled servings based on the scaling factor.
	 * @type {string | null}
	 */
	let scaledServings

	/**
	 * The list of directions for the recipe.
	 * @type {string[]}
	 */
	let directionLines = []

	/** Logic to update various variables based on the recipe data. */
	$: if (data && data.recipe) {
		ingredients = recipe.ingredients ? recipe.ingredients.split('\n') : []
		ingredientsArray = ingredientProcess(ingredients)
		recipe.directions ? (directionLines = recipe.directions.split('\n')) : null
		scaledServings = recipe.servings ? scaleNumbersInString(recipe.servings, scale) : null
	}
</script>

<h3>{recipe?.name}</h3>

<div class="grid">
	<div>
		<div class="recipe-cover">
			{#if recipe.photos && recipe.photos.length > 0}
				<img
					src="/recipe_photos/{recipe.photos[0].id}.{recipe.photos[0].fileType}"
					alt="{recipe.name} photo" />
			{:else}
				<FoodBowl height="400px" />
			{/if}
		</div>

		<p>Created: <i>{localDateAndTime(recipe.created)}</i></p>
		<p>
			Source:
			<a href={recipe?.source_url}>{recipe?.source}</a>
		</p>
		{#if ingredients}
			<p>
				Servings: {scaledServings}
			</p>
			<p>
				Scale
				<Scale bind:scale />
			</p>
		{/if}
		Categories:
		<CategoryTree {categories} isRoot={true} />
	</div>
	<div>
		<p>Ingredients:</p>
		<ul>
			{#each ingredientsArray as ingredient}
				<li>
					<strong>
						{ingredient.quantity ? decimalToFraction(ingredient.quantity * scale) : ''}
					</strong>
					{ingredient.unit && ingredient.unit !== 'q.b.' ? ingredient.unit : ''}
					{ingredient.ingredient}
				</li>
			{/each}
		</ul>
	</div>
</div>

{#if recipe?.description}
	<h4>Description:</h4>
	<p>
		{recipe?.description}
	</p>
{/if}

{#if directionLines}
	<h4>Directions:</h4>
	{#each directionLines as line}
		<p>{line}</p>
	{/each}
{/if}

<a href="/recipe/edit/{recipe?.uid}" role="button" class="outline contrast">Edit</a>

<style lang="scss">
	.recipe-cover img {
		height: 400px; /* Set to your desired height */
		width: auto; /* This will ensure the width remains proportional */
		object-fit: cover;
		display: block; /* To remove any default spacing at the bottom of images */
	}
</style>
