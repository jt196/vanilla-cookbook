<script>
	import VirtualList from 'svelte-virtual-list'
	import UserCard from './UserCard.svelte'

	export let users = []

	let start
	let end
</script>

<div class="container">
	<VirtualList items={users} bind:start bind:end let:item>
		<UserCard {item} />
	</VirtualList>
	<span class="list-indicator">
		<p>showing items {start}-{end}</p>
	</span>
</div>

<style lang="scss">
	.container {
		min-height: 200px;
		height: calc(100vh - 13em);
		@media (max-width: 1023px) {
			padding: 0;
		}
	}

	.list-indicator {
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
