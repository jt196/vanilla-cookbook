<!-- ConfirmationDialog.svelte -->
<script>
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	/** @type {{isOpen?: boolean, content?: import('svelte').Snippet}} */
	let { isOpen = $bindable(false), content, onClose, onConfirm } = $props()
</script>

<Dialog bind:isOpen {onClose}>
	{#if content}
		{@render content()}
	{:else}
		<!-- Default content if no slot is provided -->
		<h2>Confirm Action</h2>
		<p>Are you sure you want to proceed?</p>
	{/if}
	<footer>
		<Button class="secondary" onclick={() => onClose && onClose()}>Cancel</Button>
		<Button onclick={() => onConfirm && onConfirm()}>Confirm</Button>
	</footer>
</Dialog>
