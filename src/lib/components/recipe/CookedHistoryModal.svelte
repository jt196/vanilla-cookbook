<script>
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Table from '$lib/components/ui/Table/Table.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { localDateAndTime } from '$lib/utils/dateTime'

	let {
		/** @type {boolean} */
		isOpen = $bindable(false),
		/** @type {Array<{id: string, cooked: string, note?: string}>} */
		logs = []
	} = $props()

	function handleClose() {
		isOpen = false
	}
</script>

<Dialog bind:isOpen onClose={handleClose} class="max-w-2xl">
	<h3 class="font-bold text-lg mb-4">Cooking History</h3>
	{#if logs.length > 0}
		<Table size="sm" zebra bordered>
			<thead>
				<tr>
					<th>Date</th>
					<th>Note</th>
				</tr>
			</thead>
			<tbody>
				{#each logs as log}
					<tr>
						<td class="whitespace-nowrap">{localDateAndTime(log.cooked)}</td>
						<td class="text-base-content/70">{log.note || '-'}</td>
					</tr>
				{/each}
			</tbody>
		</Table>
	{:else}
		<p class="text-base-content/60">No cooking history yet.</p>
	{/if}
	<div class="modal-action">
		<Button class="btn-ghost" onclick={handleClose}>Close</Button>
	</div>
</Dialog>
