<script>
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'
	import { createRecipe } from '$lib/utils/crud'
	import { handleScrape } from '$lib/utils/parse/parseHelpersClient'
	import RecipeNewScrape from '$lib/components/RecipeNewScrape.svelte'
	import RecipeForm from '$lib/components/RecipeForm.svelte'
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
	let feedbackMessage = $state('')
	let feedbackType = $state('info')

	let initialMode = $state('url') // 'url' | 'text' | 'image'

let { data } = $props()

let { apiKeyPresent, aiEnabled, imageAllowed, userUnits, userLanguage } = $state(data)

	/**
	 * Handles the scraping event.
	 * @param {Event} event - The scrape event.
	 * @returns {Promise<void>}
	 */

	onMount(async () => {
		const urlParams = new URLSearchParams(window.location.search)
		let rawUrl = urlParams.get('url')
		let text = urlParams.get('text')

		if (!rawUrl && text && /^https?:\/\//.test(text)) {
			rawUrl = text
		}

		url = rawUrl
		sharedText = !rawUrl ? text : null

		if (url) {
			url = decodeURIComponent(url)
			initialMode = 'url'
			try {
				feedbackMessage = 'Scraping URL...'
				feedbackType = 'info'
				const scrapedData = await handleScrape(null, url)
				if (scrapedData) {
					recipe = { ...recipe, ...scrapedData }
					feedbackMessage = scrapedData._status === 'complete' ? 'URL scraped successfully.' : ''
				}
			} catch (error) {
				console.error('Error during scrape:', error)
				feedbackMessage = 'Error scraping URL.'
				feedbackType = 'error'
			}
		} else if (sharedText && apiKeyPresent && aiEnabled) {
			initialMode = 'text'
		} else if (sharedText && (!apiKeyPresent || !aiEnabled)) {
			initialMode = 'text'
			feedbackMessage = 'AI not enabled!'
		}
	})

	async function handleCreateRecipe(event) {
		event.preventDefault() // Prevent default form submission

		const result = await createRecipe(recipe)
		if (result.success) {
			// Handle success, maybe redirect or show a success message
			await goto(`/recipe/${result.data.uid}/view/`)
		} else {
			console.error('Error:', result.error)
		}
	}
</script>

<RecipeNewScrape
	bind:url
	bind:sharedText
	bind:recipe
	{apiKeyPresent}
	{aiEnabled}
	{initialMode}
	{imageAllowed}
	{userUnits}
	{userLanguage} />

<RecipeForm
	bind:recipe
	onSubmit={handleCreateRecipe}
	{aiEnabled}
	{userUnits}
	{userLanguage} />

{#if feedbackMessage}
	<FeedbackMessage message={feedbackMessage} type={feedbackType} timeout={4000} />
{/if}
