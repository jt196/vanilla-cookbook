<script>
	import { localDateAndTime } from '$lib/utils/dateTime'
	import { collectSelectedUids } from '$lib/utils/categories'
	import { shouldSkipConversion } from '$lib/utils/units'
	import { decimalToFraction, ingredientProcess, scaleNumbersInString } from '$lib/utils/filters'
	import { determineSystem, manipulateIngredient, parseDirections } from '$lib/utils/converter'
	import { onMount } from 'svelte'
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

	/**
	 * Calculated measurement system for the recipe
	 * @type {string}
	 */
	let measurementSystem = {}
	let selectedSystem
	let convertedIngredients = {}

	// Initialize the selected system based on the determined system
	function updateSelectedSystem() {
		if (measurementSystem.system !== 'inconclusive') {
			selectedSystem = measurementSystem.system
			console.log(
				'🚀 ~ file: +page.svelte:62 ~ updateSelectedSystem ~ selectedSystem:',
				selectedSystem
			)
		}
	}
	console.log('🚀 ~ file: +page.svelte:74 ~ selectedSystem:', selectedSystem)

	/** Logic to update various variables based on the recipe data. */
	$: if (data && data.recipe) {
		ingredients = recipe.ingredients ? recipe.ingredients.split('\n') : []
		ingredientsArray = ingredientProcess(ingredients)
		console.log('🚀 ~ file: +page.svelte:74 ~ ingredientsArray:', ingredientsArray)
		measurementSystem = determineSystem(ingredientsArray)
		convertedIngredients = convertIngredients(
			ingredientsArray,
			measurementSystem.system,
			selectedSystem
		)
		console.log('🚀 ~ file: +page.svelte:77 ~ convertedIngredients:', convertedIngredients)
		// Call the function to update selectedSystem based on the initial measurementSystem
		if (!selectedSystem) {
			updateSelectedSystem()
		}
		recipe.directions ? (directionLines = recipe.directions.split('\n')) : null
		scaledServings = recipe.servings ? scaleNumbersInString(recipe.servings, scale) : null
	}

	function ingredientHeader(ingredient) {
		let ingredientTitle = ingredient.trim().replace('# ', '')
		return toTitleCase(ingredientTitle)
	}

	function toTitleCase(str) {
		return str.replace(/(^|\s)\S/g, function (t) {
			return t.toUpperCase()
		})
	}

	// Function to format the system string
	function formatSystem(system) {
		return system.charAt(0).toUpperCase() + system.slice(1).replace(/([A-Z])/g, ' $1')
	}

	function convertIngredients(ingredients, system, toSystem) {
		return ingredients.map((ingredient) => {
			if (shouldSkipConversion(ingredient.unit)) {
				return ingredient
			}
			const converted = manipulateIngredient(ingredient, system, toSystem)
			if (converted === null || converted.error) {
				return ingredient
			}
			return converted
		})
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
		<CategoryTree
			{categories}
			selectedCategoryUids={collectSelectedUids(categories)}
			isRoot={true} />
	</div>
	<div>
		<p>Ingredients:</p>
		<details class="dropdown">
			<summary> Selected system: {formatSystem(selectedSystem)} </summary>
			<ul>
				<li>
					<label>
						<input type="radio" bind:group={selectedSystem} name="system" value="metric" />
						Metric
					</label>
				</li>
				<li>
					<label>
						<input type="radio" bind:group={selectedSystem} name="system" value="imperial" />
						Imperial
					</label>
				</li>
				<li>
					<label>
						<input
							type="radio"
							bind:group={selectedSystem}
							name="system"
							value="americanVolumetric" />
						American Volumetric
					</label>
				</li>
			</ul>
		</details>
		<ul>
			{#each convertedIngredients as ingredient}
				{#if ingredient && ingredient.ingredient && ingredient.ingredient.trim().startsWith('#')}
					<h4>{ingredientHeader(ingredient.ingredient)}</h4>
				{:else}
					<li>
						<strong>
							{ingredient.quantity ? decimalToFraction(ingredient.quantity * scale) : ''}
						</strong>
						{ingredient.unit && ingredient.unit !== 'q.b.' ? ingredient.unit : ''}
						{ingredient.ingredient}
					</li>
				{/if}
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
	{#each parseDirections(directionLines, selectedSystem, measurementSystem) as parsedDirection}
		<p>{parsedDirection}</p>
	{/each}
{/if}

<a href="/recipe/edit/{recipe?.uid}" role="button" class="outline contrast">Edit</a>

<style lang="scss">
	.recipe-cover img {
		height: 100%; /* Set to your desired height */
		max-height: 400px;
		width: auto; /* This will ensure the width remains proportional */
		object-fit: cover;
		display: block; /* To remove any default spacing at the bottom of images */
	}

	// Ingredients headers in the middle of text to have some spacing
	h4:not(:first-child) {
		margin-top: 20px;
	}
	h4:first-child {
		margin-top: 0;
	}
</style>
