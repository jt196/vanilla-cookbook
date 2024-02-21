<script>
	import { handleScrape } from '$lib/utils/parse/parseHelpersClient'

	export let initialUrl = ''
	export let recipe

	let url = initialUrl

	async function scrapeEventHandler(event) {
		console.log('Handling Scrape!')
		const scrapedData = await handleScrape(event, url)
		if (scrapedData) {
			recipe = { ...recipe, ...scrapedData }
		}
	}
</script>

<h3>Scrape Recipe</h3>
<div class="container">
	<form action="?/scrapeRecipe" method="POST" on:submit={scrapeEventHandler}>
		<label for="url"> URL </label>
		<input type="text" id="url" bind:value={url} />
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
