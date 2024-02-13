<script>
	export let notesLines = []
	export let sanitizedNotes = []
</script>

{#if notesLines.length > 0}
	<h3>Notes</h3>
	{#each sanitizedNotes as parsedNote}
		<p>{@html parsedNote}</p>
	{/each}
{/if}
