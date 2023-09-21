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
		console.log('🚀 ~ file: +page.svelte:89 ~ ingredients:', ingredients)
		ingredientsArray = ingredientProcess(ingredients)
		console.log('🚀 ~ file: +page.svelte:91 ~ ingredientsArray:', ingredientsArray)
		measurementSystem = determineSystem(ingredientsArray)
		convertedIngredients = convertIngredients(
			ingredientsArray,
			measurementSystem.system,
			selectedSystem
		)
		console.log('🚀 ~ file: +page.svelte:94 ~ convertedIngredients:', convertedIngredients)
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

<h3>{recipe?.name}</h3>

<div class="grid">
	<div>
		<div class="recipe-cover">
			{#if mainPhoto}
				<img
					src={mainPhoto.url
						? mainPhoto.url
						: `/recipe_photos/${mainPhoto.id}.${mainPhoto.fileType}`}
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
		<StarRating bind:rating={recipe.rating} />
		{#if ingredients}
			<p>
				Servings: {scaledServings}
			</p>
			<p>
				Scale
				<Scale bind:scale />
			</p>
		{/if}
		<div id="recipe-buttons">
			{#if recipe.userId === user.userId}
				<a
					href="/{recipe?.uid}/edit/"
					role="button"
					class="outline contrast"
					data-testid="edit-button">
					<Edit width="30px" height="30px" fill="var(--pico-ins-color)" />
				</a>
				<button
					on:click={() => handleDelete(recipe?.uid)}
					data-testid="delete-button"
					class="outline secondary">
					<Delete width="30px" height="30px" fill="var(--pico-del-color)" />
				</button>
			{/if}
		</div>
		<div id="categories">
			Categories:
			<CategoryTree
				{categories}
				selectedCategoryUids={collectSelectedUids(categories)}
				isRoot={true} />
		</div>
	</div>
	<div>
		<div class="ing-header">
			<p>Ingredients:</p>
		</div>
		<div class="convert">
			<details class="dropdown">
				<summary> Convert to: </summary>
				<ul>
					{#if measurementSystem.system !== 'metric'}
						<li>
							<label>
								<input type="radio" bind:group={selectedSystem} name="system" value="metric" />
								Metric
							</label>
						</li>
					{/if}

					{#if measurementSystem.system !== 'imperial'}
						<li>
							<label>
								<input type="radio" bind:group={selectedSystem} name="system" value="imperial" />
								Imperial
							</label>
						</li>
					{/if}

					{#if measurementSystem.system !== 'americanVolumetric'}
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
					{/if}
				</ul>
			</details>
			<div>
				<button
					on:click={() => (selectedSystem = null)}
					data-testid="delete-button"
					data-tooltip="Reset to original measurement system"
					class="outline secondary">
					<Delete width="30px" height="30px" fill="var(--pico-del-color)" />
				</button>
			</div>
		</div>
		<div class="ing-system">
			<div>System: {!selectedSystem ? measurementSystem.system : selectedSystem}</div>
			<fieldset data-tooltip="Display more ingredient information">
				<label>
					Extra:
					<input type="checkbox" name="english" bind:checked={displayExtra} />
				</label>
			</fieldset>
		</div>
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
						{ingredient.unit && ingredient.unit !== 'q.b.' ? ingredient.unit : ''}
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
</div>

{#if recipe?.description}
	<h4>Description:</h4>
	<p>
		{recipe?.description}
	</p>
{/if}

{#if directionLines}
	<h4>Directions:</h4>
	{#each sanitizedDirections as parsedDirection}
		<p>
			{@html parsedDirection}
		</p>
	{/each}
{/if}

{#if otherPhotos.length > 0}
	<div class="other-photos">
		{#each otherPhotos as photo (photo.id)}
			<img src="/recipe_photos/{photo.id}.{photo.fileType}" alt="{recipe.name} photo" />
		{/each}
		<a
			href="/{recipe?.uid}/images/"
			role="button"
			class="outline contrast"
			data-testid="edit-button">
			<Images width="30px" height="30px" fill="var(--pico-ins-color)" />
		</a>
	</div>
{/if}

<style lang="scss">
	.recipe-cover img {
		height: 100%; /* Set to your desired height */
		max-height: 400px;
		width: auto; /* This will ensure the width remains proportional */
		object-fit: cover;
		display: block; /* To remove any default spacing at the bottom of images */
	}

	.other-photos {
		margin-bottom: 1rem;
		img {
			max-height: 150px;
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

	.ing-system {
		display: flex;
		gap: 1rem;
		justify-content: space-between;
	}
</style>
