<script>
	import { page } from '$app/state'
	import { onMount } from 'svelte'

	let sharedText = ''

	onMount(() => {
		const urlParams = new URLSearchParams(page.url.search)
		const text = urlParams.get('text')
		if (text) {
			sharedText = decodeURIComponent(text)
		}
	})
</script>

<h1>Shared Text Import</h1>

<form>
	<label for="text">Shared Text</label>
	<input id="text" type="text" bind:value={sharedText} />
</form>
