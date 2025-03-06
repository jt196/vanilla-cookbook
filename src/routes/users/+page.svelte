<script>
	import { goto } from '$app/navigation'
	import UserList from '$lib/components/UserList.svelte'
	import House from '$lib/components/svg/House.svelte'

	/** @type {{data: any}} */
	let { data } = $props()
	const { users, viewingUser } = $state(data)
</script>

{#if viewingUser && viewingUser.id}
	<button data-tooltip="Go to my recipes" onclick={() => goto(`/user/${viewingUser.id}/recipes`)}>
		<House width="1.5rem" />
	</button>
{/if}
<h3>Users</h3>
<p>Click on one to see their public recipes</p>
<UserList {users} />
