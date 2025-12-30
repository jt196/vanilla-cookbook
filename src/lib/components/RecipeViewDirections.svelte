<script>
	/** @type {{directionLines?: any, sanitizedDirections?: any}} */
	let { directionLines = [], sanitizedDirections = [] } = $props();
</script>

{#if directionLines.length > 0}
	<h3 class="text-2xl font-bold mb-4 mt-6">Directions</h3>
	{#each sanitizedDirections as parsedDirection}
		<p class="text-base mb-3 leading-relaxed">{@html parsedDirection}</p>
	{/each}
{/if}
