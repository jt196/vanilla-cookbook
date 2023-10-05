<script>
	import TickSymbol from '$lib/components/svg/TickSymbol.svelte'
	import X from '$lib/components/svg/X.svelte'

	export let isTrue = true
	export let width = '20px'
	export let fill = 'white'
</script>

{#if isTrue}
	<TickSymbol {width} {fill} />
{:else}
	<X {width} {fill} />
{/if}
