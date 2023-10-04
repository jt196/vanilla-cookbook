<script>
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { createRecipe } from '$lib/utils/crud'
	import { handleScrape } from '$lib/utils/parse/parseHelpersClient'
	import RecipeNewScrape from '$lib/components/RecipeNewScrape.svelte'
	import RecipeForm from '$lib/components/RecipeForm.svelte'

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

<RecipeNewScrape initialUrl={url} bind:recipe />

<RecipeForm bind:recipe onSubmit={handleCreateRecipe} />
