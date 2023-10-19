<script>
	export let directionLines = []
	export let sanitizedDirections = []
</script>

{#if directionLines.length > 0}
	<h3>Directions</h3>
	{#each sanitizedDirections as parsedDirection}
		<p>{@html parsedDirection}</p>
	{/each}
{/if}
