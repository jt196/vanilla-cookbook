<script>
	import UserList from '$lib/components/UserList.svelte'

	/** @type {{data: any}} */
	let { data } = $props()
	const { filteredUsers, userCount } = $state(data)
</script>

<div class="prose max-w-none flex justify-center">
	<h2>Vanilla Users</h2>
</div>
{#if userCount === 0}
	<p>There are currently no other users with recipes!</p>
{:else}
	<UserList users={filteredUsers} />
{/if}
