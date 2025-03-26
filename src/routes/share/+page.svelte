<script>
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'

	onMount(() => {
		const params = new URLSearchParams(window.location.search)
		const url = params.get('url')
		const text = params.get('text')

		if (url) {
			goto(`/new/?scrape=${encodeURIComponent(url)}`)
		} else if (text) {
			goto(`/new/text/?text=${encodeURIComponent(text)}`)
		} else {
			goto('/') // fallback if neither is shared
		}
	})
</script>

<p>Redirecting...</p>
