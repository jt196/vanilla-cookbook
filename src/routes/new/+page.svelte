<script>
	import { nutritionProcess } from '$lib/utils/filters'
	import { checkImageExistence } from '$lib/utils/image/imageUtils'
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { createRecipe } from '$lib/utils/crud'
	import { handleScrape } from '$lib/utils/parse/parseHelpersClient'
	import RecipeNewScrape from '$lib/components/RecipeNewScrape.svelte'

	let baseUrl = ''
	let url = ''

	/**
	 * The scraped recipe object.
	 * @typedef {Object} Recipe
	 * @property {string} name - Name of the recipe.
	 * @property {string} source - Source of the recipe.
	 * @property {string} source_url - URL source of the recipe.
	 * @property {string} cook_time - Cook time of the recipe.
	 * @property {string} image_url - Image URL of the recipe.
	 * @property {string} prep_time - Preparation time of the recipe.
	 * @property {string} ingredients - Ingredients of the recipe.
	 * @property {string} directions - Directions of the recipe.
	 * @property {string} total_time - Total time of the recipe.
	 * @property {string} servings - Servings of the recipe.
	 * @property {string} nutritional_info - Nutritional information of the recipe.
	 */

	/** @type {Recipe} */
	let recipe = {
		name: '',
		source: '',
		source_url: '',
		cook_time: '',
		image_url: '',
		prep_time: '',
		ingredients: '',
		directions: '',
		total_time: '',
		servings: '',
		nutritional_info: ''
	}

	/**
	 * Handles the scraping event.
	 * @param {Event} event - The scrape event.
	 * @returns {Promise<void>}
	 */
	onMount(async () => {
		// Check for the 'scrape' parameter and populate the form
		const urlParams = new URLSearchParams(window.location.search)
		const scrapeUrl = urlParams.get('scrape')
		scrapeUrl ? (url = scrapeUrl) : null

		if (scrapeUrl) {
			// Populate the URL input field
			url = decodeURIComponent(scrapeUrl)

			// Call the handleScrape function directly and get the scraped data
			try {
				const scrapedData = await handleScrape(null, url)
				if (scrapedData) {
					recipe = { ...recipe, ...scrapedData }
				}
			} catch (error) {
				console.error('Error during scrape:', error)
			}
		}
	})

	let imageExists = false

	$: if (recipe.image_url && baseUrl) {
		checkImageExistence(recipe.image_url, baseUrl).then((result) => {
			return (imageExists = result)
		})
	}

	async function handleCreateRecipe(event) {
		event.preventDefault() // Prevent default form submission

		const result = await createRecipe(recipe)
		if (result.success) {
			// Handle success, maybe redirect or show a success message
			goto(`/${result.data.uid}/view/`)
		} else {
			console.error('Error:', result.error)
		}
	}
</script>

<RecipeNewScrape initialUrl={url} {baseUrl} bind:recipe />

<form on:submit|preventDefault={handleCreateRecipe}>
	<h3>New Recipe</h3>

	<label for="name"> Name </label>
	<input type="text" id="name" name="name" bind:value={recipe.name} />

	<label for="source"> Source </label>
	<input type="text" id="source" name="source" bind:value={recipe.source} />

	<label for="source_url"> Source URL </label>
	<input type="text" id="source_url" name="source_url" bind:value={recipe.source_url} />

	<label for="cook_time"> Cook Time </label>
	<input type="text" id="cook_time" name="cook_time" bind:value={recipe.cook_time} />

	<label for="image_url"> Image URL </label>
	<input type="text" id="image_url" name="image_url" bind:value={recipe.image_url} />
	{#if recipe.image_url && imageExists}
		<img
			class="recipe-thumbnail"
			loading="lazy"
			src={recipe.image_url}
			alt="{recipe.image_url} thumbnail" />
	{/if}
	<label for="prep_time"> Prep Time </label>
	<input type="text" id="prep_time" name="prep_time" bind:value={recipe.prep_time} />

	<label for="ingredients"> Ingredients </label>
	<textarea id="ingredients" name="ingredients" rows="5" bind:value={recipe.ingredients} />

	<label for="directions"> Directions </label>
	<textarea id="directions" name="directions" rows="5" bind:value={recipe.directions} />

	<label for="total_time"> Total Time </label>
	<input type="text" id="total_time" name="total_time" bind:value={recipe.total_time} />

	<label for="servings"> Servings </label>
	<input type="text" id="servings" name="servings" bind:value={recipe.servings} />

	<label for="nutritional_info"> Nutritional Information </label>
	<textarea
		id="nutritional_info"
		name="nutritional_info"
		rows="5"
		bind:value={recipe.nutritional_info} />

	<button type="submit">Add Recipe</button>
</form>

<style lang="scss">
	.recipe-thumbnail {
		width: 100px;
		height: auto;
		object-fit: cover;
		display: block;
	}
</style>
