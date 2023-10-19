<script>
	export let notesLines = []
	console.log('🚀 ~ file: RecipeViewNotes.svelte:3 ~ notesLines:', notesLines.length)
	console.log('🚀 ~ file: RecipeViewNotes.svelte:3 ~ notesLines:', notesLines === true)
	export let sanitizedNotes = []
</script>

{#if notesLines.length > 0}
	<h3>Notes</h3>
	{#each sanitizedNotes as parsedNote}
		<p>{@html parsedNote}</p>
	{/each}
{/if}
