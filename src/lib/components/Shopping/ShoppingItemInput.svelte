<script>
	import New from '$lib/components/svg/New.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	let {
		/**
		 * @type {string}
		 */
		value = $bindable(''),
		/**
		 * @type {() => void}
		 */
		onAdd,
		/**
		 * @type {(event: KeyboardEvent) => void}
		 */
		onKeyPress = undefined
	} = $props()
</script>

<div class="add-ingredient">
	<input
		type="text"
		placeholder="Enter ingredient..."
		bind:value
		onkeydown={onKeyPress} />
	<Button onclick={onAdd}>
		<New width="20px" fill="white" />
	</Button>
</div>

<style>
	.add-ingredient {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.add-ingredient input {
		margin-bottom: 0;
		min-height: 40px;
	}
</style>
