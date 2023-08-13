<script>
	import { flip } from 'svelte/animate'
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action'

	export let nodes = {}
	export let node

	const flipDurationMs = 300
	function handleDndConsider(e) {
		node.items = e.detail.items
	}
	function handleDndFinalize(e) {
		node.items = e.detail.items
		console.log(e)
		nodes = { ...nodes }
	}
</script>

<b>{node.name}</b>
{#if node.hasOwnProperty('items')}
	<section
		use:dndzone={{ items: node.items, flipDurationMs, centreDraggedOnCursor: true }}
		on:consider={handleDndConsider}
		on:finalize={handleDndFinalize}>
		<!-- WE FILTER THE SHADOW PLACEHOLDER THAT WAS ADDED IN VERSION 0.7.4, filtering this way rather than checking whether 'nodes' have the id became possible in version 0.9.1 -->
		{#each node.items.filter((item) => item.uid !== SHADOW_PLACEHOLDER_ITEM_ID) as item (item.uid)}
			<div animate:flip={{ duration: flipDurationMs }} class="item">
				<svelte:self bind:nodes node={nodes[item.uid]} />
			</div>
		{/each}
	</section>
{/if}

<style>
	section {
		width: auto;
		max-width: 400px;
		border: 0px solid black;
		padding: 0.4em;
		/* this will allow the dragged element to scroll the list */
		overflow-y: auto;
		height: auto;
		background-color: rgba(100, 100, 100, 0.1);
	}
	div {
		width: 90%;
		padding: 0.3em;
		border: 0px solid blue;
		margin: 0.15em 0;
	}
	.item {
		background-color: rgba(00, 100, 100, 0.1);
	}
</style>
