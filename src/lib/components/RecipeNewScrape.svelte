<script>
	import { handleScrape } from '$lib/utils/parse/parseHelpersClient'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'

	/**
	 * @type {{
	 *   initialUrl?: string,
	 *   recipe: any,
	 *   onUrlChange?: (newUrl: string) => void
	 * }}
	 */
	let { initialUrl = '', recipe = $bindable(), onUrlChange } = $props()

	let feedbackMessage = $state('')
	let feedbackType = $state('info')

	// Instead of having a separate reactive state, use the prop directly.
	async function scrapeEventHandler(event) {
		event.preventDefault()
		console.log('Handling Scrape!')

		feedbackMessage = ''
		feedbackType = 'info'

		try {
			const scrapedData = await handleScrape(event, initialUrl)
			if (scrapedData && scrapedData.ingredients && scrapedData.directions) {
				recipe = { ...recipe, ...scrapedData }
				feedbackMessage = 'Recipe successfully scraped!'
				feedbackType = 'success'
			} else if (scrapedData) {
				recipe = { ...recipe, ...scrapedData }
				feedbackMessage = 'Recipe partially scraped!'
				feedbackType = 'error'
			}
		} catch (error) {
			console.error('Error:', error)
			feedbackMessage = 'Error scraping recipe. Please check the URL or try again.'
			feedbackType = 'error'
		}
	}
</script>

<h3>Scrape Recipe</h3>
<div class="container">
	<form action="?/scrapeRecipe" method="POST" onsubmit={scrapeEventHandler}>
		<label for="url"> URL </label>
		<!-- Use the prop directly and call onUrlChange when input changes -->
		<input
			type="text"
			id="url"
			value={initialUrl}
			oninput={(e) => onUrlChange && onUrlChange(e.target.value)} />
		<button type="submit">Scrape Recipe</button>
	</form>
</div>

<div>
	{#if feedbackMessage}
		<FeedbackMessage message={feedbackMessage} type={feedbackType} timeout={4000} />
	{/if}
</div>

<style lang="scss">
	.container {
		display: flex;
		align-items: start; // Align items to the top
		width: 100%; // Ensure the container takes the full width
		padding: 0;

		form {
			flex: 1; // Allow the form to take up the remaining space
		}
	}
</style>
