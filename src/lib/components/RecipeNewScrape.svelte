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
	let {
		initialUrl = '',
		recipe = $bindable(),
		onUrlChange,
		apiKeyPresent = false,
		aiEnabled = false
	} = $props()

	let feedbackMessage = $state('')
	let feedbackType = $state('info')

	$effect(() => {
		console.log('🚀 ~ aiEnabled:', aiEnabled)
		console.log('🚀 ~ apiKeyPresent:', apiKeyPresent)
	})

	// Instead of having a separate reactive state, use the prop directly.
	async function scrapeEventHandler(event) {
		event.preventDefault()
		feedbackMessage = 'Scraping recipe...'
		feedbackType = 'info'

		try {
			const scrapedData = await handleScrape(event, initialUrl)
			// Always update recipe with the scraped data
			recipe = { ...recipe, ...scrapedData }

			// Determine feedback based on _status and _source
			if (scrapedData._status === 'complete') {
				feedbackMessage =
					scrapedData._source === 'AI' ? 'AI scrape success!' : 'Manual scrape success!'
				feedbackType = 'success'
			} else {
				feedbackMessage =
					scrapedData._source === 'AI' ? 'AI partially scraped.' : 'Manual partially scraped.'
				feedbackType = 'warning'
			}
		} catch (error) {
			console.error('Error:', error)
			feedbackMessage = 'Error scraping recipe. Please check the URL or try again.'
			feedbackType = 'error'
		}
	}
</script>

<h3>Scrape Recipe</h3>
<p class="warning">
	{#if aiEnabled}
		{#if !apiKeyPresent}
			Please add your OpenAI Key to the <code>.env</code> file to use the AI functionality.
		{:else}
			Your OpenAI Key is present in the <code>.env</code> file. Will use on scrape fail.
		{/if}
	{/if}
</p>

<div class="container">
	<form action="?/scrapeRecipe" method="POST" onsubmit={scrapeEventHandler}>
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
			display: flex;
			align-items: stretch;
			width: 100%;
			gap: 0.5rem;
			button {
				width: auto;
			}
			input {
				flex: 1;
			}
		}
	}
</style>
