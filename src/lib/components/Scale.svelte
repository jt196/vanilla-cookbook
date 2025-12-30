<script>
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'

	/**
	 * @typedef {number} Scale
	 */

	/** @type {{scale?: Scale}} */
	let { scale = 1, onScaleChange } = $props()

	const MIN_SCALE = 0.1
	const SMALL_STEP = 0.1
	const BIG_STEP = 1

	const clampScale = (value) => Math.max(MIN_SCALE, parseFloat(value.toFixed(2)))

	function adjust(delta) {
		const next = clampScale(scale + delta)
		onScaleChange && onScaleChange(next)
	}

	function handleInput(event) {
		const value = parseFloat(event.target.value)
		if (isNaN(value)) return
		onScaleChange && onScaleChange(clampScale(value))
	}
</script>

<div class="scale">
	<Button
		onclick={() => adjust(-BIG_STEP)}
		style="soft"
		color="secondary"
		aria-label="Decrease by 1">-1</Button>
	<Button
		onclick={() => adjust(-SMALL_STEP)}
		style="soft"
		color="secondary"
		aria-label="Decrease by 0.1">-0.1</Button>
	<Input type="number" value={scale} min="0.1" step="0.1" oninput={handleInput} />
	<Button
		onclick={() => adjust(SMALL_STEP)}
		style="soft"
		color="secondary"
		aria-label="Increase by 0.1">+0.1</Button>
	<Button onclick={() => adjust(BIG_STEP)} style="soft" color="secondary" aria-label="Increase by 1"
		>+1</Button>
</div>

<style lang="scss">
	.scale {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 1rem 0;

		:global(button) {
			margin-bottom: 0;
		}

		input {
			margin: 0;
			min-width: 5rem;
			text-align: center;
			font-weight: 600;
		}

		button {
			border-width: 0;
			justify-content: center;
			min-width: 3.25rem;
		}
	}
</style>
