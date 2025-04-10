<script>
	import UserList from '$lib/components/UserList.svelte'

	/** @type {{data: any}} */
	let { data } = $props()
	const { filteredUsers } = $state(data)

	let usersLength = $derived(filteredUsers.length)
</script>

<div class="user-title">
	<h3>Vanilla Users</h3>
</div>
{#if usersLength === 0}
	<p>There are currently no public profiles on this site!</p>
{:else}
	<UserList users={filteredUsers} />
{/if}
