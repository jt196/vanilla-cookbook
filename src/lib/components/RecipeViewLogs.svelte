<script>
	import { localDateAndTime } from '$lib/utils/dateTime'

	/** @type {{logs?: any}} */
	let { logs = [] } = $props()
</script>

{#if logs.length > 0}
	<h3>Dates Cooked</h3>
	{#each logs as log}
		<p>{localDateAndTime(log.cooked)}</p>
	{/each}
{/if}
