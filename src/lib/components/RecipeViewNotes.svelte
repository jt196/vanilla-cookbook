<script>
	/** @type {{notesLines?: any, sanitizedNotes?: any}} */
	let { notesLines = [], sanitizedNotes = [] } = $props();
</script>

{#if notesLines.length > 0}
	<h3>Notes</h3>
	{#each sanitizedNotes as parsedNote}
		<p>{@html parsedNote}</p>
	{/each}
{/if}
