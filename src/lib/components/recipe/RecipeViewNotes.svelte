<script>
	import RecipeViewLogs from './RecipeViewLogs.svelte'
	import CollapseSection from '$lib/components/ui/CollapseSection.svelte'

	/** @type {{notesLines?: any, sanitizedNotes?: any, logs?: any, open?: boolean}} */
	let { notesLines = [], sanitizedNotes = [], logs = [], open = false } = $props()

	const safeLogs = $derived(Array.isArray(logs) ? logs : [])
</script>

{#if notesLines.length > 0 || safeLogs.some((log) => log.note)}
	<CollapseSection title="Notes" className="mt-6" {open}>
		<div class="prose max-w-none">
			{#if notesLines.length > 0 || safeLogs.length > 0}
				{#each sanitizedNotes as parsedNote}
					<p>{@html parsedNote}</p>
				{/each}
			{/if}
			<RecipeViewLogs logs={safeLogs} />
		</div>
	</CollapseSection>
{/if}
