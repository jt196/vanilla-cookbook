<script>
	import Bookmark from '$lib/components/svg/Bookmark.svelte'
	import { buildBookmarkletCode } from '$lib/utils/bookmarklet'
	import { onMount } from 'svelte'

	let bookmarkletCode
	let baseUrl

	onMount(() => {
		// Set the base URL and generate the bookmarklet code
		baseUrl = window.location.origin
		bookmarkletCode = buildBookmarkletCode(baseUrl)
	})
</script>

<div class="bookmarklet-button prose max-w-none w-full md:w-2/3 lg:w-1/2">
	<p>1. Drag This Bookmark to Your Browser Toolbar</p>
	<a href={bookmarkletCode} class="btn btn-primary" role="button"><Bookmark width="25px" /></a
	><br />
	<p>
		2. Rename to something convenient and easy to remember, like <strong>Vanilla Import</strong>.
		Usually, right click on it and <italic>Edit Bookmark</italic>.
	</p>
	<p>
		3. When you're on a website, click on the bookmark, and it'll bring you to the new recipe page,
		with the source URL and captured page text ready for scraping or fallback parsing.
	</p>
</div>

<style lang="scss">
	a {
		margin-bottom: 1rem;
	}
</style>
