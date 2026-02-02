<script>
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Textarea from '$lib/components/ui/Form/Textarea.svelte'

	let {
		/** @type {boolean} */
		isOpen = $bindable(false),
		/** @type {(note: string | null) => void} */
		onSubmit,
		/** @type {boolean} */
		loading = false
	} = $props()

	let note = $state('')

	function handleSubmit() {
		onSubmit(note.trim() || null)
		note = ''
	}

	function handleClose() {
		isOpen = false
		note = ''
	}
</script>

<Dialog bind:isOpen onClose={handleClose}>
	<h3 class="font-bold text-lg mb-4">Did you cook this today?</h3>
	<form
		onsubmit={(e) => {
			e.preventDefault()
			handleSubmit()
		}}>
		<Textarea
			label="Add a note (optional)"
			bind:value={note}
			rows={3}
			placeholder="How did it turn out? Any tweaks you made?"
			disabled={loading} />
		<div class="modal-action">
			<Button type="button" class="btn-ghost" onclick={handleClose} disabled={loading}>
				Cancel
			</Button>
			<Button type="submit" class="btn-primary" disabled={loading}>
				{#if loading}
					<span class="loading loading-spinner loading-sm"></span>
				{/if}
				Log Cooked
			</Button>
		</div>
	</form>
</Dialog>
