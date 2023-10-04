<script>
	import Bookmark from '$lib/components/svg/Bookmark.svelte'
	import { handleScrape } from '$lib/utils/parse/parseHelpersClient'

	import { onMount } from 'svelte'

	export let initialUrl = ''
	export let baseUrl = ''
	export let recipe

	let url = initialUrl
	let bookmarkletCode = ''

	onMount(() => {
		// Set the base URL and generate the bookmarklet code
		baseUrl = window.location.origin
		bookmarkletCode = `javascript:(function() {
            var currentUrl = encodeURIComponent(window.location.href);
            var newUrl = '${baseUrl}/new?scrape=' + currentUrl;
            window.open(newUrl, '_blank');
        })();`
	})

	async function scrapeEventHandler(event) {
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
	<div class="bookmarklet-button">
		<p>Drag This Bookmark to Your Browser Toolbar to Scrape External Web Pages</p>
		<a href={bookmarkletCode} role="button"><Bookmark width="25px" /></a>
	</div>
</div>

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
</style>
