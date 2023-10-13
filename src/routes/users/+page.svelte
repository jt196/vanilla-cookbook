<script>
	import UserList from '$lib/components/UserList.svelte'

	export let data
	const { users } = data
	console.log('🚀 ~ file: +page.svelte:17 ~ users:', users)
</script>

<UserList {users} />
