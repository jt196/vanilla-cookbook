<script>
	import { decodeHTMLEntities, nutritionProcess } from '$lib/utils/filters'
	import { checkImageExistence } from '$lib/utils/image/imageUtils'
	import { onMount } from 'svelte'
	import Bookmark from '$lib/components/svg/Bookmark.svelte'
	import { goto } from '$app/navigation'
	import { createRecipe } from '$lib/utils/crud'
	import { scrapeRecipeFromURL } from '$lib/utils/parse/parseHelpersClient'

	let baseUrl = ''
	let bookmarkletCode = ''
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
	async function handleScrape(event) {
		if (event) event.preventDefault()

		const result = await scrapeRecipeFromURL(url)
		if (result.success) {
			const scrapedRecipe = result.data
			recipe.name = scrapedRecipe.name
			recipe.source = scrapedRecipe.author
			recipe.source_url = scrapedRecipe.sourceUrl
			recipe.cook_time = scrapedRecipe.cookTime
			recipe.image_url = scrapedRecipe.imageUrl
			recipe.prep_time = scrapedRecipe.prepTime
			recipe.ingredients = scrapedRecipe.ingredients.join('\n')
			recipe.directions = scrapedRecipe.instructions.join('\n\n')
			recipe.total_time = scrapedRecipe.totalTime
			recipe.servings = scrapedRecipe.yeld
			recipe.nutritional_info = nutritionProcess(scrapedRecipe.nutrition)
		} else {
			console.error('Error:', result.error)
		}
	}
	onMount(() => {
		// Set the base URL and generate the bookmarklet code
		baseUrl = window.location.origin
		console.log('🚀 ~ file: +page.svelte:91 ~ onMount ~ baseUrl:', baseUrl)
		bookmarkletCode = `javascript:(function() {
        var currentUrl = encodeURIComponent(window.location.href);
        var newUrl = '${baseUrl}/new?scrape=' + currentUrl;
        window.open(newUrl, '_blank');
    })();`

		// Check for the 'scrape' parameter and populate the form
		const urlParams = new URLSearchParams(window.location.search)
		const scrapeUrl = urlParams.get('scrape')
		if (scrapeUrl) {
			// Populate the URL input field
			url = decodeURIComponent(scrapeUrl)

			// Call the handleScrape function directly
			handleScrape().catch((error) => {
				console.error('Error during scrape:', error)
			})
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

<h3>Scrape Recipe</h3>
<div class="container">
	<form action="?/scrapeRecipe" method="POST" on:submit={handleScrape}>
		<label for="url"> URL </label>
		<input type="text" id="url" bind:value={url} />
		<button type="submit">Scrape Recipe</button>
	</form>
	<div class="bookmarklet-button">
		<p>Drag This Bookmark to Your Browser Toolbar to Scrape External Web Pages</p>
		<a href={bookmarkletCode} role="button"><Bookmark width="25px" /></a>
	</div>
</div>

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
	.container {
		display: flex;
		align-items: start; // Align items to the top
		width: 100%; // Ensure the container takes the full width

		form {
			flex: 1; // Allow the form to take up the remaining space
			margin-right: 20px; // Add some spacing between the form and the button
		}

		.bookmarklet-button {
			max-width: 300px;
			flex-shrink: 0; // Prevent the button from shrinking
			flex-grow: 0; // Prevent the button from growing
		}
	}
	.recipe-thumbnail {
		width: 100px;
		height: auto;
		object-fit: cover;
		display: block;
	}
</style>
