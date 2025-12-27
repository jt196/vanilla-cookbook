<script>
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'

	let {
		/**
		 * @type {boolean}
		 */
		isOpen = $bindable(false),
		/**
		 * @type {any}
		 */
		item = $bindable({}),
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
		<label for="edit-name">Name:</label>
		<input id="edit-name" type="text" bind:value={item.name} />

		<label for="edit-quantity">Quantity:</label>
		<input id="edit-quantity" type="number" bind:value={item.quantity} />

		<label for="edit-unit">Unit:</label>
		<input id="edit-unit" type="text" bind:value={item.unit} />

		<footer>
			<Button type="button" onclick={() => (isOpen = false)}>Cancel</Button>
			<Button
				type="button"
				class="outline secondary"
				id="delete-item"
				onclick={() => onDelete(item.uid)}
				><Delete width="15px" height="15px" fill="var(--pico-del-color)" /></Button>
			<Button type="submit">Save</Button>
		</footer>
	</form>
</Dialog>

<style lang="scss">
	form > footer {
		display: flex;
		gap: 0.5rem;
		justify-content: space-between;

		:global(button) {
			flex: 1;
		}

		#delete-item {
			flex: 0 1 35px;
			padding: 0 0.5rem;
			max-height: 35px;
		}
	}
</style>
