<script>
	import UserList from '$lib/components/UserList.svelte'

	/** @type {{data: any}} */
	let { data } = $props()
	const { filteredUsers, userCount } = $state(data)
</script>

<div class="user-title">
	<h3>Vanilla Users</h3>
</div>
{#if userCount === 0}
	<p>There are currently no other users with recipes!</p>
{:else}
	<UserList users={filteredUsers} />
{/if}
