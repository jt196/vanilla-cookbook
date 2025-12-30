<script>
	import { localDateAndTime } from '$lib/utils/dateTime'

	/** @type {{logs?: any}} */
	let { logs = [] } = $props()
</script>

{#if logs.length > 0}
	<h3 class="text-2xl font-bold mb-4">Dates Cooked</h3>
	{#each logs as log}
		<p class="text-base mb-2 text-base-content/70">{localDateAndTime(log.cooked)}</p>
	{/each}
{/if}
