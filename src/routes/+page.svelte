<script>
	import { goto } from '$app/navigation'
	import { browser } from '$app/environment'

	export let data
	const { user } = data

	$: if (browser && user && user.userId) {
		goto(`/user/${user.userId}/recipes`) // Navigate to the user's recipes
	}
</script>

<h1>Cookrr Personal Cookbook</h1>
