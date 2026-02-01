<script>
	import RecipeViewLogs from './RecipeViewLogs.svelte'

	/** @type {{notesLines?: any, sanitizedNotes?: any, logs?: any}} */
	let { notesLines = [], sanitizedNotes = [], logs = [] } = $props()

	const safeLogs = $derived(Array.isArray(logs) ? logs : [])
</script>

{#if notesLines.length > 0 || safeLogs.some((log) => log.note)}
	<div class="prose max-w-none mt-6">
		{#if notesLines.length > 0 || safeLogs.length > 0}
			<h3>Notes</h3>
			{#each sanitizedNotes as parsedNote}
				<p>{@html parsedNote}</p>
			{/each}
		{/if}
		<RecipeViewLogs logs={safeLogs} />
	</div>
{/if}
