<script>
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Table from '$lib/components/ui/Table/Table.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Textarea from '$lib/components/ui/Form/Textarea.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import InfoText from '$lib/components/ui/InfoText.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import { localDateAndTime } from '$lib/utils/dateTime'

	let {
		/** @type {boolean} */
		isOpen = $bindable(false),
		/** @type {Array<{id: string, cooked: string, note?: string, scale?: number}>} */
		logs = [],
		/** @type {(scale: number) => void} */
		onRestoreScale = null,
		/** @type {(logId: string, note: string | null, scale: number) => Promise<void>} */
		onLogUpdated = null,
		/** @type {(logId: string) => Promise<void>} */
		onLogDeleted = null
	} = $props()

	let editDialogOpen = $state(false)
	let editingLog = $state(null)
	let editNote = $state('')
	let editScale = $state(1)
	let saving = $state(false)

	function handleClose() {
		isOpen = false
	}

	function handleRestoreScale(scale) {
		if (onRestoreScale && scale) {
			onRestoreScale(scale)
			isOpen = false
		}
	}

	async function handleDelete(logId) {
		if (!onLogDeleted) return
		await onLogDeleted(logId)
	}

	function openEditDialog(log) {
		if (!onLogUpdated) return
		editingLog = log
		editNote = log.note || ''
		editScale = log.scale ?? 1
		editDialogOpen = true
	}

	function closeEditDialog() {
		editDialogOpen = false
		editingLog = null
		editNote = ''
		editScale = 1
	}

	async function handleSaveLog() {
		if (!editingLog || !onLogUpdated) return
		saving = true
		await onLogUpdated(editingLog.id, editNote.trim() || null, editScale)
		saving = false
		closeEditDialog()
	}
</script>

<Dialog bind:isOpen onClose={handleClose} class="max-w-2xl">
	<h3 class="font-bold text-lg mb-4">Cooking History</h3>
	{#if logs.length > 0}
		{#if onLogUpdated}
			<InfoText class="mb-2">Click on a row to edit the note or scale.</InfoText>
		{/if}
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
					<tr
						class={onLogUpdated ? 'cursor-pointer hover:bg-base-200' : ''}
						onclick={() => openEditDialog(log)}>
						<td class="whitespace-nowrap">{localDateAndTime(log.cooked)}</td>
						<td class="text-base-content/70">{log.note || '-'}</td>
						<td>
							{log.scale ?? 1}x
							{#if onRestoreScale}
								<Button
									size="xs"
									style="soft"
									color="primary"
									onclick={(e) => {
										e.stopPropagation()
										handleRestoreScale(log.scale ?? 1)
									}}
									class="ml-2 tooltip"
									data-tip="Use this scale">
									Use
								</Button>
							{/if}
							{#if onLogDeleted}
								<Button
									size="xs"
									style="soft"
									color="error"
									onclick={(e) => {
										e.stopPropagation()
										handleDelete(log.id)
									}}
									class="ml-1 tooltip"
									data-tip="Delete log">
									<Delete width="14px" height="14px" />
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

<Dialog bind:isOpen={editDialogOpen} onClose={closeEditDialog}>
	<h3 class="font-bold text-lg mb-4">Edit Cooking Log</h3>
	<form
		onsubmit={(e) => {
			e.preventDefault()
			handleSaveLog()
		}}>
		<Textarea
			label="Note"
			bind:value={editNote}
			rows={3}
			placeholder="How did it turn out? Any tweaks you made?"
			disabled={saving} />
		<div class="mt-4">
			<Input label="Scale" type="number" bind:value={editScale} disabled={saving} />
		</div>
		<div class="modal-action">
			<Button type="button" class="btn-ghost" onclick={closeEditDialog} disabled={saving}>
				Cancel
			</Button>
			<Button type="submit" class="btn-primary" disabled={saving}>
				{#if saving}
					<span class="loading loading-spinner loading-sm"></span>
				{/if}
				Save
			</Button>
		</div>
	</form>
</Dialog>
