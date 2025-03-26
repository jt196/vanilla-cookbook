<script>
	import { handleParse, handleScrape } from '$lib/utils/parse/parseHelpersClient'
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import { defaultRecipe } from '$lib/utils/config'

	/**
	 * @type {{
	 *   url?: string,
	 *   sharedText?: string,
	 *   recipe: any,
	 *   onUrlChange?: (newUrl: string) => void,
	 *   apiKeyPresent?: boolean,
	 *   aiEnabled?: boolean
	 * }}
	 */
	let {
		url = $bindable(''),
		sharedText = $bindable(null),
		recipe = $bindable(),
		scrapeActive = true,
		apiKeyPresent = false,
		aiEnabled = false
	} = $props()

	$effect(() => {
		console.log('🚀 ~ apiKeyPresent:', apiKeyPresent)
		console.log('🚀 ~ aiEnabled:', aiEnabled)
	})

	let feedbackMessage = $state('')
	let feedbackType = $state('info')

	async function scrapeEventHandler(event) {
		event.preventDefault()
		feedbackMessage = scrapeActive ? 'Scraping URL...' : 'Parsing Text...'
		feedbackType = 'info'

		if (scrapeActive) {
			try {
				recipe = defaultRecipe
				const scrapedData = await handleScrape(event, url)
				recipe = { ...recipe, ...scrapedData }

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
				feedbackMessage = 'Error scraping recipe. Please check the input or try again.'
				feedbackType = 'error'
			}
		} else {
			try {
				recipe = defaultRecipe
				const parsedData = await handleParse(event, sharedText)
				recipe = { ...recipe, ...parsedData }
				feedbackMessage = 'Text parsed successfully.'
				feedbackType = 'success'
			} catch (error) {
				console.error('Error:', error)
				feedbackMessage = 'Error parsing text. Please check the input or try again.'
				feedbackType = 'error'
			}
		}
	}
</script>

<div class="title">
	<h3>
		{scrapeActive ? 'Scrape Recipe from URL' : 'Parse Text for Recipe'}
	</h3>

	{#if aiEnabled}
		<p class="warning">
			{#if scrapeActive}
				{apiKeyPresent
					? 'AI scraping fallback enabled.'
					: 'Add your OpenAI Key to the .env file to enable AI fallback when scraping fails.'}
			{:else}
				{apiKeyPresent
					? 'AI text parsing enabled.'
					: 'Add your OpenAI Key to the .env file to enable AI text parsing.'}
			{/if}
		</p>
	{/if}
</div>

<div class="container">
	<form onsubmit={scrapeEventHandler}>
		{#if scrapeActive}
			<input type="text" id="url" bind:value={url} />
		{:else}
			<textarea id="text" rows="10" bind:value={sharedText}></textarea>
		{/if}
		<button type="submit">
			{scrapeActive ? 'Scrape URL' : 'Parse Text'}
		</button>
	</form>
</div>

{#if feedbackMessage}
	<FeedbackMessage message={feedbackMessage} type={feedbackType} timeout={4000} />
{/if}

<style lang="scss">
	.container {
		display: flex;
		align-items: start;
		width: 100%;
		padding: 0;

		form {
			display: flex;
			align-items: stretch;
			width: 100%;
			gap: 0.5rem;
			@media (max-width: 768px) {
				flex-direction: column;
			}

			input,
			textarea {
				flex: 1;
			}
			button {
				height: auto;
				max-height: 33.25px;
				width: 120px;
			}
		}
	}
	.title {
		margin-top: 1rem;
	}
</style>
