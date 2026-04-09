<script>
	import Bookmark from '$lib/components/svg/Bookmark.svelte'
	import { buildBookmarkletCode } from '$lib/utils/bookmarklet'
	import { onMount } from 'svelte'
	import { t } from '$lib/stores/locale.js'

	let bookmarkletCode
	let baseUrl

	onMount(() => {
		// Set the base URL and generate the bookmarklet code
		baseUrl = window.location.origin
		bookmarkletCode = buildBookmarkletCode(baseUrl)
	})
</script>

<div class="bookmarklet-button prose max-w-none w-full md:w-2/3 lg:w-1/2">
	<p>{$t('bookmarklet.step1')}</p>
	<a href={bookmarkletCode} class="btn btn-primary" role="button"><Bookmark width="25px" /></a><br
	/>
	<p>
		{$t('bookmarklet.renamePrefix')} <strong>{$t('bookmarklet.renameExample')}</strong>.
		{$t('bookmarklet.renameSuffix')} <italic>{$t('bookmarklet.editBookmark')}</italic>.
	</p>
	<p>
		{$t('bookmarklet.step3')}
	</p>
</div>

<style lang="scss">
	a {
		margin-bottom: 1rem;
	}
</style>
