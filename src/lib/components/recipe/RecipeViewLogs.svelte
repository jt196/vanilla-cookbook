<script>
	import { localDateAndTime } from '$lib/utils/dateTime'

	/** @type {{logs?: any}} */
	let { logs = [] } = $props()

	let logsWithNotes = $derived(logs.filter((log) => log.note))
</script>

{#if logsWithNotes.length > 0}
	<div class="card bg-base-200/50 p-4 mt-4">
		<div class="space-y-3">
			{#each logsWithNotes as log}
				<div class="border-l-2 border-primary pl-3">
					<p class="text-sm text-base-content/60 mb-1">{localDateAndTime(log.cooked)}</p>
					<p class="text-base-content/80">{log.note}</p>
				</div>
			{/each}
		</div>
	</div>
{/if}
