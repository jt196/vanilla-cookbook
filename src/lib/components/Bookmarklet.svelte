<script>
	import Bookmark from '$lib/components/svg/Bookmark.svelte'
	import { onMount } from 'svelte'

	let bookmarkletCode
	let baseUrl

	onMount(() => {
		// Set the base URL and generate the bookmarklet code
		baseUrl = window.location.origin
		bookmarkletCode = `javascript:(function() {
            var currentUrl = encodeURIComponent(window.location.href);
            var newUrl = '${baseUrl}/recipe/new?url=' + currentUrl;
            window.open(newUrl, '_blank');
        })();`
	})
</script>

<div class="bookmarklet-button">
	<p>1. Drag This Bookmark to Your Browser Toolbar</p>
	<a href={bookmarkletCode} role="button"><Bookmark width="25px" /></a><br />
	<p>
		2. Rename to something convenient and easy to remember, like <strong>Vanilla Import</strong>.
		Usually, right click on it and <italic>Edit Bookmark</italic>.
	</p>
	<p>
		3. When you're on a website, click on the bookmark, and it'll bring you to the new recipe page,
		hopefully with the data loaded and ready to save.
	</p>
</div>

<style lang="scss">
	a {
		margin-bottom: 1rem;
	}
</style>
