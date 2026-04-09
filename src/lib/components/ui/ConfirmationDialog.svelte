<!-- ConfirmationDialog.svelte -->
<script>
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { t } from '$lib/stores/locale.js'

	/** @type {{isOpen?: boolean, content?: import('svelte').Snippet}} */
	let { isOpen = $bindable(), content, onClose, onConfirm } = $props()
</script>

<Dialog bind:isOpen {onClose}>
	{#if content}
		{@render content()}
	{:else}
		<!-- Default content if no slot is provided -->
		<h3 class="font-bold text-lg">{$t('dialog.confirmAction')}</h3>
		<p class="py-4">{$t('dialog.confirmProceed')}</p>
	{/if}
	<div class="modal-action">
		<Button style="outline" onclick={() => onClose && onClose()}>{$t('common.cancel')}</Button>
		<Button onclick={() => onConfirm && onConfirm()}>{$t('common.confirm')}</Button>
	</div>
</Dialog>
