<script>
	import New from '$lib/components/svg/New.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'

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
	<Input
		type="text"
		placeholder="Enter ingredient..."
		bind:value
		useLabelAsPlaceholder={false}
		size="lg"
		oninput={onKeyPress} />
	<Button onclick={onAdd} size="lg" aria-label="Add ingredient">
		<New width="20px" fill="white" />
	</Button>
</div>

<style>
	.add-ingredient {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
</style>
