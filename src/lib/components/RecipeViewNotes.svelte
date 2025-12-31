<script>
	/** @type {{notesLines?: any, sanitizedNotes?: any}} */
	let { notesLines = [], sanitizedNotes = [] } = $props();
</script>

{#if notesLines.length > 0}
	<div class="prose max-w-none mt-6">
		<h3>Notes</h3>
		{#each sanitizedNotes as parsedNote}
			<p>{@html parsedNote}</p>
		{/each}
	</div>
{/if}
