<script>
	import { goto } from '$app/navigation'
	import { browser } from '$app/environment'

	/** @type {{data: any}} */
	let { data } = $props()

	const { user } = $state(data)

	$effect(() => {
		if (browser && user && user.userId) {
			goto(`/user/${user.userId}/recipes`) // Navigate to the user's recipes
		}
	})
</script>

<h1>Cookrr Personal Cookbook</h1>
