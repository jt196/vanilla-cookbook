<script>
	import { goto } from '$app/navigation'
	import { onMount } from 'svelte'

	export let data
	const { user } = data

	onMount(() => {
		if (user) {
			goto(`/user/${user.userId}/recipes`)
		}
	})
</script>

<h3>Cookrr Personal Cookbook</h3>
<p>Please <a href="/login">Login</a> to see your recipes.</p>
