<script>
	/** @type {{notesLines?: any, sanitizedNotes?: any}} */
	let { notesLines = [], sanitizedNotes = [] } = $props();
</script>

{#if notesLines.length > 0}
	<h3 class="text-2xl font-bold mb-4 mt-6">Notes</h3>
	{#each sanitizedNotes as parsedNote}
		<p class="text-base mb-3 leading-relaxed">{@html parsedNote}</p>
	{/each}
{/if}
