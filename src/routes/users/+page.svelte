<script>
	import { goto } from '$app/navigation'
	import UserList from '$lib/components/UserList.svelte'
	import House from '$lib/components/svg/House.svelte'

	export let data
	const { users, viewingUser } = data
	console.log('🚀 ~ file: +page.svelte:8 ~ viewingUser:', viewingUser)
	console.log('🚀 ~ file: +page.svelte:17 ~ users:', users)
</script>

{#if viewingUser && viewingUser.id}
	<button data-tooltip="Go to my recipes" on:click={() => goto(`/user/${viewingUser.id}/recipes`)}>
		<House width="1.5rem" />
	</button>
{/if}
<h3>Users</h3>
<p>Click on one to see their public recipes</p>
<UserList {users} />
