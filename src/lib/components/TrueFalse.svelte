<script>
	import TickSymbol from '$lib/components/svg/TickSymbol.svelte'
	import X from '$lib/components/svg/X.svelte'

	/** @type {{isTrue?: boolean, width?: string, fill?: string}} */
	let { isTrue = true, width = '20px', fill = 'white' } = $props();
</script>

{#if isTrue}
	<TickSymbol {width} {fill} />
{:else}
	<X {width} {fill} />
{/if}
