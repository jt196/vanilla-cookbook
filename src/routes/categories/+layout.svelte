<script>
	import { overrideItemIdKeyNameBeforeInitialisingDndZones } from 'svelte-dnd-action'
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();

	overrideItemIdKeyNameBeforeInitialisingDndZones('uid')
</script>

{@render children?.()}
