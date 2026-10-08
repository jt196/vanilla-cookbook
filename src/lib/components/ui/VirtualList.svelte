<script>
	import SvelteVirtualList from '@humanspeak/svelte-virtual-list'

	/** @type {{items?: any[], itemHeight?: number, start?: number, end?: number, children?: import('svelte').Snippet}} */
	let { items = [], itemHeight = 100, start = $bindable(), end = $bindable(), children } = $props()

	/** @param {import('@humanspeak/svelte-virtual-list').SvelteVirtualListRangeInfo} range */
	function handleRangeChange(range) {
		start = range.start
		end = range.end
	}
</script>

<div class="h-full">
	<SvelteVirtualList
		{items}
		defaultEstimatedItemHeight={itemHeight}
		onRangeChange={handleRangeChange}>
		{#snippet renderItem(item, index)}
			{@render children?.(item, index)}
		{/snippet}
	</SvelteVirtualList>
</div>
