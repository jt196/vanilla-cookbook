<script>
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'
	import { browser } from '$app/environment'

	export let data
	const { user } = data

	let isInitialLoad = true // Flag to track the initial load

	$: if (browser && isInitialLoad && user && user.userId) {
		goto(`/user/${user.userId}/recipes`)
		isInitialLoad = false
	}

	onMount(() => {
		isInitialLoad = false // Ensure flag is set to false after initial mount to prevent redirection later
	})
</script>

<h1>Cookrr Personal Cookbook</h1>
