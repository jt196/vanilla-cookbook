<script>
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	/** @type {{isOpen?: boolean, onCancel?: () => void, onStay?: () => void, onView?: () => void, viewDisabled?: boolean, message?: string | null}} */
	let { isOpen = $bindable(), onCancel, onStay, onView, viewDisabled = false, message = null } = $props()
</script>

<Dialog bind:isOpen>
	<div class="flex flex-col gap-4">
		<h3 class="font-bold text-lg">Fork Recipe</h3>
		<p>{message || 'Fork this recipe into your account and view it now?'}</p>
		<div class="flex items-center justify-between gap-2">
			<Button style="outline" onclick={onCancel}>Cancel</Button>
			<div class="flex gap-2">
				<Button style="outline" onclick={onStay}>Stay</Button>
				<Button onclick={onView} disabled={viewDisabled}>View</Button>
			</div>
		</div>
	</div>
</Dialog>
