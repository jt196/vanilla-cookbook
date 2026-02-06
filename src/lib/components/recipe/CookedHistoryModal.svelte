<script>
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Table from '$lib/components/ui/Table/Table.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { localDateAndTime } from '$lib/utils/dateTime'

	let {
		/** @type {boolean} */
		isOpen = $bindable(false),
		/** @type {Array<{id: string, cooked: string, note?: string, scale?: number}>} */
		logs = [],
		/** @type {(scale: number) => void} */
		onRestoreScale = null
	} = $props()

	function handleClose() {
		isOpen = false
	}

	function handleRestoreScale(scale) {
		if (onRestoreScale && scale) {
			onRestoreScale(scale)
			isOpen = false
		}
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
					<th>Scale</th>
				</tr>
			</thead>
			<tbody>
				{#each logs as log}
					<tr>
						<td class="whitespace-nowrap">{localDateAndTime(log.cooked)}</td>
						<td class="text-base-content/70">{log.note || '-'}</td>
						<td>
							{log.scale ?? 1}x
							{#if onRestoreScale}
								<Button
									size="xs"
									style="soft"
									color="primary"
									onclick={() => handleRestoreScale(log.scale ?? 1)}
									class="ml-2 tooltip"
									data-tip="Use this scale"
								>
									Use
								</Button>
							{/if}
						</td>
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
