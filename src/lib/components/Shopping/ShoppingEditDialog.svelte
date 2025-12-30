<script>
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'

	let {
		/**
		 * @type {boolean}
		 */
		isOpen = $bindable(),
		/**
		 * @type {any}
		 */
		item = $bindable({
			name: '',
			quantity: '',
			unit: '',
			uid: ''
		}),
		/**
		 * @type {(event: Event) => void}
		 */
		onSave,
		/**
		 * @type {(uid: string) => void}
		 */
		onDelete,
		/**
		 * @type {() => void}
		 */
		onClose = undefined
	} = $props()
</script>

<Dialog bind:isOpen {onClose}>
	<form onsubmit={onSave}>
		<h3 class="font-bold text-lg mb-4">Edit Shopping Item</h3>

		<Input id="edit-name" label="Name:" type="text" bind:value={item.name} />
		<Input id="edit-quantity" label="Quantity:" type="number" bind:value={item.quantity} />
		<Input id="edit-unit" label="Unit:" type="text" bind:value={item.unit} />

		<div class="modal-action justify-between">
			<Button type="button" color="error" onclick={() => (isOpen = false)}>Cancel</Button>
			<div class="flex gap-2">
				<Button
					type="button"
					style="outline"
					color="error"
					id="delete-item"
					onclick={() => onDelete(item.uid)}>
					<Delete width="15px" height="15px" fill="currentColor" />
				</Button>
				<Button type="submit">Save</Button>
			</div>
		</div>
	</form>
</Dialog>
