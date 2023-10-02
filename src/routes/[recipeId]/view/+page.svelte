<script>
	import { localDateAndTime } from '$lib/utils/dateTime'
	import { collectSelectedUids } from '$lib/utils/categories'
	import { decimalToFraction, ingredientProcess, scaleNumbersInString } from '$lib/utils/filters'
	import { determineSystem, parseDirections, convertIngredients } from '$lib/utils/converter'
	import { getSanitizedHTML } from '$lib/utils/render'
	import { deleteRecipeById } from '$lib/utils/crud'
	import { onMount } from 'svelte'
	import Scale from '$lib/components/Scale.svelte'
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'
	import Images from '$lib/components/svg/Images.svelte'
	import CategoryTree from '$lib/components/CategoryTree.svelte'
	import StarRating from '$lib/components/StarRating.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import Edit from '$lib/components/svg/Edit.svelte'
	import { goto } from '$app/navigation'

	/**
	 * Data for the current page.
	 * @type {PageData}
	 */
	export let data

	let { recipe, categories, user } = data
	console.log('🚀 ~ file: +page.svelte:25 ~ user:', user)
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
	let convertedIngredients = {}

	let selectedSystem = user?.units

	let summary

	function getLabelFromValue(value) {
		const system = systems.find((s) => s.value === value)
		return system ? system.label : null
	}

	$: {
		const originalLabel = getLabelFromValue(measurementSystem?.system)
		const selectedLabel = getLabelFromValue(selectedSystem)

		if (originalLabel) {
			summary = `${originalLabel} (original)`
			if (selectedLabel && selectedSystem !== measurementSystem.system) {
				summary += ` to ${selectedLabel}`
			}
		} else {
			summary = 'Loading...'
		}
	}

	const systems = [
		{ value: 'metric', label: 'Metric' },
		{ value: 'imperial', label: 'Imperial' },
		{ value: 'americanVolumetric', label: 'US Cups' }
	]

	let displayExtra = false

	async function handleDelete(uid) {
		const success = await deleteRecipeById(uid)
		if (success) {
			goto('/')
		}
	}

	let mainPhoto

	$: {
		if (recipe && recipe.photos && recipe.photos.length > 0) {
			mainPhoto =
				recipe.photos.find((photo) => photo.isMain) ||
				recipe.photos.find((photo) => !photo.isMain && photo.url === null) ||
				recipe.photos.find((photo) => !photo.isMain)
		}
	}

	let otherPhotos = recipe.photos
		? recipe.photos.filter((photo) => photo !== mainPhoto && photo.url === null)
		: []

	/** Logic to update various variables based on the recipe data. */
	$: if (data && data.recipe) {
		ingredients = recipe.ingredients ? recipe.ingredients.split('\n') : []
		ingredientsArray = ingredientProcess(ingredients)
		measurementSystem = determineSystem(ingredientsArray)
		convertedIngredients = convertIngredients(
			ingredientsArray,
			measurementSystem.system,
			selectedSystem
		)
		console.log('🚀 ~ file: +page.svelte:124 ~ measurementSystem.system:', measurementSystem.system)
		console.log('🚀 ~ file: +page.svelte:126 ~ selectedSystem:', selectedSystem)
		// Call the function to update selectedSystem based on the initial measurementSystem
		recipe.directions ? (directionLines = recipe.directions.split('\n')) : null
		scaledServings = recipe.servings ? scaleNumbersInString(recipe.servings, scale) : null
	}

	let sanitizedDirections = []
	let sanitizedIngredients = []

	let isMounted = false

	onMount(() => {
		isMounted = true
	})

	// Reactive statement to update sanitizedDirections whenever dependencies change
	$: if (isMounted) {
		sanitizedDirections = parseDirections(directionLines, selectedSystem, measurementSystem).map(
			(direction) => getSanitizedHTML(direction)
		)
		sanitizedIngredients = convertedIngredients.map((ingredient) => {
			return {
				...ingredient,
				ingredient: getSanitizedHTML(ingredient.ingredient)
			}
		})
	}
</script>

<div id="recipe-buttons">
	{#if recipe.userId === user.userId}
		<a href="/{recipe?.uid}/edit/" role="button" class="outline contrast" data-testid="edit-button">
			<Edit width="30px" height="30px" fill="var(--pico-ins-color)" />
		</a>
		<button
			on:click={() => handleDelete(recipe?.uid)}
			data-testid="delete-button"
			class="outline secondary">
			<Delete width="30px" height="30px" fill="var(--pico-del-color)" />
		</button>
		<a
			href="/{recipe?.uid}/images/"
			role="button"
			class="outline contrast"
			data-testid="edit-button">
			<Images width="30px" height="30px" fill="var(--pico-ins-color)" />
		</a>
	{/if}
</div>

<div class="recipe-details">
	<div class="recipe-cover">
		{#if mainPhoto}
			<img
				src={mainPhoto.url && !mainPhoto.fileType
					? mainPhoto.url
					: `/api/recipe/image/${mainPhoto.id}`}
				alt="{recipe.name} photo" />
		{:else}
			<FoodBowl height="400px" />
		{/if}
	</div>
	<div class="recipe-about">
		<h1>{recipe?.name}</h1>

		<p>Created: <i>{localDateAndTime(recipe.created)}</i></p>
		<p>
			Source:
			<a href={recipe?.source_url}>{recipe?.source}</a>
		</p>
		<StarRating bind:rating={recipe.rating} />
		<div id="categories">
			<CategoryTree {categories} selectedCategoryUids={collectSelectedUids(categories)} />
		</div>
	</div>
</div>
<div class="description">
	{#if recipe?.description}
		<h3>Description:</h3>
		<p>
			{recipe?.description}
		</p>
	{/if}
</div>
<div class="recipe-main">
	<div class="ing-div">
		<div class="ing-header">
			<h3>Ingredients</h3>
		</div>
		{#if ingredients}
			<p>
				Servings: {scaledServings}
			</p>
			<p>
				<Scale bind:scale />
			</p>
		{/if}
		<div class="ingredients">
			<fieldset data-tooltip="Display more ingredient information">
				<label>
					Display extra:
					<input type="checkbox" name="english" bind:checked={displayExtra} />
				</label>
			</fieldset>
			<ul>
				{#each sanitizedIngredients as ingredient}
					{#if ingredient.ingredient.trim() === ''}
						<br />
					{:else if /<h[1-6]>/.test(ingredient.ingredient)}
						<div data-heading>{@html ingredient.ingredient}</div>
					{:else}
						<li>
							<strong>
								{#if ingredient.minQty == ingredient.maxQty && ingredient.quantity}
									{decimalToFraction(ingredient.quantity * scale)}
								{:else if ingredient.minQty != ingredient.maxQty && ingredient.quantity}
									{decimalToFraction(ingredient.minQty * scale)}-{decimalToFraction(
										ingredient.maxQty * scale
									)}
								{/if}
							</strong>
							{#if ingredient.unit && ingredient.unit !== 'q.b.'}
								{ingredient.quantity * scale > 1 && ingredient.unitPlural
									? ingredient.unitPlural
									: ingredient.unit}
							{/if}
							<!-- <span>{@html ingredient.ingredient} <strong>{ingredient.dietLabel}</strong></span> -->
							<span
								>{@html ingredient.ingredient}
								{#if displayExtra && ingredient.additional}
									<i> | {ingredient.additional}</i>
								{/if}
							</span>
						</li>
					{/if}
				{/each}
			</ul>
		</div>
		<div class="convert">
			<details class="dropdown">
				<summary>
					{summary}
				</summary>
				<ul>
					{#each systems as system}
						<li>
							<label>
								<input
									type="radio"
									bind:group={selectedSystem}
									name="system"
									value={system.value}
									checked={system.value === selectedSystem} />
								{system.label}
							</label>
						</li>
					{/each}
				</ul>
			</details>
		</div>
	</div>
	<div class="recipe-text">
		{#if directionLines}
			<h3>Directions</h3>
			{#each sanitizedDirections as parsedDirection}
				<p>
					{@html parsedDirection}
				</p>
			{/each}
		{/if}
	</div>
</div>

{#if otherPhotos.length > 0}
	<div class="other-photos">
		{#each otherPhotos as photo (photo.id)}
			<img src="/api/recipe/image/{photo.id}" alt="{recipe.name} photo" />
		{/each}
	</div>
{/if}

<style lang="scss">
	.recipe-cover {
		img {
			height: 100%; /* Set to your desired height */
			max-height: 400px;
			width: auto; /* This will ensure the width remains proportional */
			object-fit: cover;
			display: block; /* To remove any default spacing at the bottom of images */
		}
		margin-bottom: 1rem;
	}

	.recipe-main {
		margin-top: 2rem;
		display: flex;
		gap: 2rem;
		.recipe-text {
			flex: 2;
		}
		.ing-div {
			flex: 1;
		}
		@media (max-width: 767px) {
			flex-direction: column;
		}
	}

	.recipe-details {
		display: flex;
		gap: 2rem;
		.recipe-about {
			flex: 2;
			#categories {
				margin-top: 1rem;
				ul {
					padding-left: 1rem;
				}
			}
		}
		.recipe-cover {
			flex: 1;
		}
		@media (max-width: 767px) {
			flex-direction: column;
		}
	}

	.button-cat {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	#recipe-buttons {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.other-photos {
		margin: 1rem 0 2rem 0;
		img {
			max-height: 150px;
			margin-right: 1rem;
		}
	}

	// Ingredients headers in the middle of text to have some spacing
	h4:not(:first-child) {
		margin-top: 20px;
	}
	h4:first-child {
		margin-top: 0;
	}

	.convert {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}

	.dropdown {
		flex-grow: 1; /* Tells the dropdown to take up all available space */
		flex-shrink: 1; /* Allows the dropdown to shrink if necessary */
		flex-basis: auto; /* Default starting size before growing or shrinking */
		min-width: 0; /* Makes sure it respects its parent's size */
	}

	div > button {
		flex-grow: 0; /* Button should not grow */
		flex-shrink: 0; /* Button should not shrink */
	}

	.ingredients {
		ul {
			padding-left: 0;
			li {
				list-style-type: none;
			}
		}
	}
</style>
