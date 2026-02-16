<script>
	import SvelteVirtualList from '@humanspeak/svelte-virtual-list'

	/** @type {{items?: any[], itemHeight?: number, mode?: 'topToBottom' | 'bottomToTop', start?: number, end?: number, children?: import('svelte').Snippet}} */
	let {
		items = [],
		itemHeight = 100,
		mode = 'topToBottom',
		start = $bindable(),
		end = $bindable(),
		children
	} = $props()
</script>

<div class="h-full">
	<SvelteVirtualList {items} {mode} defaultEstimatedItemHeight={itemHeight} bind:start bind:end>
		{#snippet renderItem(item, index)}
			{@render children?.(item, index)}
		{/snippet}
	</SvelteVirtualList>
</div>
