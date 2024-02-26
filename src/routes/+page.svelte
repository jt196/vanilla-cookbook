<script>
	import { goto } from '$app/navigation'

	export let data
	const { user } = data

	$: if (user && user.userId) {
		goto(`/user/${user.userId}/recipes`)
	}
</script>

<h1>Cookrr Personal Cookbook</h1>
