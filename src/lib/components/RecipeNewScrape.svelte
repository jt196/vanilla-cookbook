<script>
	import { handleScrape } from '$lib/utils/parse/parseHelpersClient'

	/**
	 * @type {{
	 *   initialUrl?: string,
	 *   recipe: any,
	 *   onUrlChange?: (newUrl: string) => void
	 * }}
	 */
	let { initialUrl = '', recipe = $bindable(), onUrlChange } = $props()

	// Instead of having a separate reactive state, use the prop directly.
	async function scrapeEventHandler(event) {
		event.preventDefault()
		console.log('Handling Scrape!')
		const scrapedData = await handleScrape(event, initialUrl)
		if (scrapedData) {
			recipe = { ...recipe, ...scrapedData }
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
