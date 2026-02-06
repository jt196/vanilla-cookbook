<script>
	import { localDate, localTime } from '$lib/utils/dateTime'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Textarea from '$lib/components/ui/Form/Textarea.svelte'
	import Edit from '$lib/components/svg/Edit.svelte'

	/** @type {{logs?: any, onNoteUpdated?: (logId: string, note: string | null) => void}} */
	let { logs = [], onNoteUpdated } = $props()

	let logsWithNotes = $derived(logs.filter((log) => log.note))

	let editDialogOpen = $state(false)
	let editingLog = $state(null)
	let editNote = $state('')
	let saving = $state(false)

	function openEditDialog(log) {
		editingLog = log
		editNote = log.note || ''
		editDialogOpen = true
	}

	function closeEditDialog() {
		editDialogOpen = false
		editingLog = null
		editNote = ''
	}

	async function handleSaveNote() {
		if (!editingLog || !onNoteUpdated) return
		saving = true
		await onNoteUpdated(editingLog.id, editNote.trim() || null)
		saving = false
		closeEditDialog()
	}
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
				{#if onNoteUpdated}
					<Button
						style="ghost"
						size="sm"
						class="btn-square opacity-50 hover:opacity-100"
						onclick={() => openEditDialog(log)}
					>
						<Edit width="16px" height="16px" />
					</Button>
				{/if}
			</li>
		{/each}
	</ul>
{/if}

<Dialog bind:isOpen={editDialogOpen} onClose={closeEditDialog}>
	<h3 class="font-bold text-lg mb-4">Edit Note</h3>
	<form
		onsubmit={(e) => {
			e.preventDefault()
			handleSaveNote()
		}}
	>
		<Textarea
			label="Note"
			bind:value={editNote}
			rows={4}
			placeholder="How did it turn out?"
			disabled={saving}
		/>
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
