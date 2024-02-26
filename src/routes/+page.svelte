<script>
	import { onMount } from 'svelte'
	import { goto } from '$app/navigation'

	export let data
	const { user } = data

	onMount(() => {
		if (user && user.userId) {
			goto(`/user/${user.userId}/recipes`) // Redirect to the recipe page if the user is logged in
		}
	})
</script>

<h1>Cookrr Personal Cookbook</h1>
