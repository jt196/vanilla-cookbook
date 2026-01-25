<!-- ConfirmationDialog.svelte -->
<script>
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	/** @type {{isOpen?: boolean, content?: import('svelte').Snippet}} */
	let { isOpen = $bindable(), content, onClose, onConfirm } = $props()
</script>

<Dialog bind:isOpen {onClose}>
	{#if content}
		{@render content()}
	{:else}
		<!-- Default content if no slot is provided -->
		<h3 class="font-bold text-lg">Confirm Action</h3>
		<p class="py-4">Are you sure you want to proceed?</p>
	{/if}
	<div class="modal-action">
		<Button style="outline" onclick={() => onClose && onClose()}>Cancel</Button>
		<Button onclick={() => onConfirm && onConfirm()}>Confirm</Button>
	</div>
</Dialog>
