<script>
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { createRecipe } from '$lib/utils/crud'
	import { handleScrape } from '$lib/utils/parse/parseHelpersClient'
	import RecipeNewScrape from '$lib/components/RecipeNewScrape.svelte'
	import RecipeForm from '$lib/components/RecipeForm.svelte'
	import Chain from '$lib/components/svg/Chain.svelte'
	import Note from '$lib/components/svg/Note.svelte'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import { defaultRecipe } from '$lib/utils/config'

	/**
	 * The scraped recipe object.
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

	let recipe = $state({ ...defaultRecipe })

	let url = $state(null)
	let sharedText = $state(null)
	let scrapeActive = $state(true)
	let feedbackMessage = $state('')
	let feedbackType = $state('info')

	let { data } = $props()

	let { apiKeyPresent, aiEnabled } = $state(data)

	/**
	 * Handles the scraping event.
	 * @param {Event} event - The scrape event.
	 * @returns {Promise<void>}
	 */
	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search)
		url = urlParams.get('url')
		sharedText = urlParams.get('text')

		if (url) {
			url = decodeURIComponent(url)
			try {
				const scrapedData = await handleScrape(null, url)
				if (scrapedData) {
					recipe = { ...recipe, ...scrapedData }
				}
			} catch (error) {
				console.error('Error during scrape:', error)
			}
		} else if (sharedText && apiKeyPresent && aiEnabled) {
			scrapeActive = false
		} else if (sharedText && (!apiKeyPresent || !aiEnabled)) {
			feedbackMessage = 'AI not enabled!'
		}
	})

	async function handleCreateRecipe(event) {
		event.preventDefault() // Prevent default form submission

		const result = await createRecipe(recipe)
		if (result.success) {
			// Handle success, maybe redirect or show a success message
			goto(`/recipe/${result.data.uid}/view/`)
		} else {
			console.error('Error:', result.error)
		}
	}
</script>

{#if aiEnabled && apiKeyPresent}
	<div class="tab-toggle">
		<button
			onclick={() => {
				scrapeActive = !scrapeActive
				url = null
				sharedText = null
				recipe = defaultRecipe
			}}>
			{#if scrapeActive}
				<Note width="20px" /> Parse
			{:else}
				<Chain width="20px" /> Scrape
			{/if}
		</button>
	</div>
{/if}

<RecipeNewScrape bind:url bind:sharedText {scrapeActive} {apiKeyPresent} {aiEnabled} bind:recipe />

<RecipeForm bind:recipe onSubmit={handleCreateRecipe} />

{#if feedbackMessage}
	<FeedbackMessage message={feedbackMessage} type={feedbackType} timeout={4000} />
{/if}
