<script>
	import CategoryItemSimple from '$lib/components/CategoryItemSimple.svelte'


	import { flip } from 'svelte/animate'
	import { dndzone, SHADOW_PLACEHOLDER_ITEM_ID } from 'svelte-dnd-action'
	/** @type {{nodes?: any, node?: any}} */
	let { nodes = $bindable({}), node = {} } = $props();

	const flipDurationMs = 300
</script>

<b>{node.name}</b>
{#if node.hasOwnProperty('items')}
	<section use:dndzone={{ items: node.items, flipDurationMs, centreDraggedOnCursor: true }}>
		{#each node.items.filter((item) => item.uid !== SHADOW_PLACEHOLDER_ITEM_ID) as item (item.uid)}
			<div animate:flip={{ duration: flipDurationMs }} class="item">
				<CategoryItemSimple bind:nodes node={nodes[item.uid]} />
			</div>
		{/each}
	</section>
{/if}
