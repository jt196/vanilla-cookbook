<script>
	import { localDate, localTime } from '$lib/utils/dateTime'

	/** @type {{logs?: any}} */
	let { logs = [] } = $props()

	let logsWithNotes = $derived(logs.filter((log) => log.note))
</script>

{#if logsWithNotes.length > 0}
	<ul class="list bg-base-100 rounded-box shadow-md mt-4">
		{#each logsWithNotes as log}
			<li class="list-row items-start">
				<div class="text-sm text-base-content/60 min-w-20">
					<div>{localDate(log.cooked)}</div>
					<div class="text-xs">{localTime(log.cooked)}</div>
				</div>
				<div class="flex-1">
					<p class="text-base-content/80 whitespace-pre-line">{log.note}</p>
				</div>
			</li>
		{/each}
	</ul>
{/if}
