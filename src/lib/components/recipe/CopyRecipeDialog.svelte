<script>
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import { t } from '$lib/stores/locale.js'

	/** @type {{isOpen?: boolean, onCancel?: () => void, onStay?: () => void, onView?: () => void, viewDisabled?: boolean, message?: string | null, messageCode?: string | null}} */
	let {
		isOpen = $bindable(),
		onCancel,
		onStay,
		onView,
		viewDisabled = false,
		message = null,
		messageCode = null
	} = $props()
</script>

<Dialog bind:isOpen>
	<div class="flex flex-col gap-4">
		<h3 class="font-bold text-lg">{$t('copyDialog.title')}</h3>
		<p>{messageCode ? $t(messageCode) : message || $t('copyDialog.description')}</p>
		<div class="flex items-center justify-between gap-2">
			<Button style="outline" onclick={onCancel}>{$t('common.cancel')}</Button>
			<div class="flex gap-2">
				<Button style="outline" onclick={onStay}>{$t('common.stay')}</Button>
				<Button onclick={onView} disabled={viewDisabled}>{$t('common.view')}</Button>
			</div>
		</div>
	</div>
</Dialog>
