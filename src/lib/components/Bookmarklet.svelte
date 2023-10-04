<script>
	import Bookmark from '$lib/components/svg/Bookmark.svelte'
	import { onMount } from 'svelte'

	export let baseUrl = ''
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
</script>

<div class="bookmarklet-button">
	<p>Drag This Bookmark to Your Browser Toolbar to Scrape External Web Pages</p>
	<a href={bookmarkletCode} role="button"><Bookmark width="25px" /></a>
</div>

<style lang="scss">
	.bookmarklet-button {
		max-width: 300px;
		flex-shrink: 0; // Prevent the button from shrinking
		flex-grow: 0; // Prevent the button from growing
	}
</style>
