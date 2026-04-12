<script>
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'
	import { t } from '$lib/stores/locale.js'

	/**
	 * @typedef {number} Scale
	 */

	/** @type {{scale?: Scale, baseServings?: number}} */
	let { scale = 1, onScaleChange, baseServings = 1 } = $props()

	const MIN_SCALE = 0.1
	const SMALL_STEP = 1
	const BIG_STEP = 5

	// Display value in servings units
	const displayValue = $derived(parseFloat((scale * baseServings).toFixed(2)))

	const clampScale = (multiplier) => Math.max(MIN_SCALE, parseFloat(multiplier.toFixed(4)))

	function adjust(delta) {
		const newServings = Math.max(baseServings * MIN_SCALE, displayValue + delta)
		const next = clampScale(newServings / baseServings)
		onScaleChange && onScaleChange(next)
	}

	function handleInput(event) {
		const servings = parseFloat(event.target.value)
		if (isNaN(servings) || servings <= 0) return
		onScaleChange && onScaleChange(clampScale(servings / baseServings))
	}
</script>

<div class="scale">
	<Button
		onclick={() => adjust(-BIG_STEP)}
		style="soft"
		color="secondary"
		aria-label={$t('scaleControl.decreaseFive')}>-5</Button
	>
	<Button
		onclick={() => adjust(-SMALL_STEP)}
		style="soft"
		color="secondary"
		aria-label={$t('scaleControl.decreaseOne')}>-1</Button
	>
	<Input type="number" value={displayValue} min={parseFloat((baseServings * MIN_SCALE).toFixed(2))} step="1" oninput={handleInput} />
	<Button
		onclick={() => adjust(SMALL_STEP)}
		style="soft"
		color="secondary"
		aria-label={$t('scaleControl.increaseOne')}>+1</Button
	>
	<Button
		onclick={() => adjust(BIG_STEP)}
		style="soft"
		color="secondary"
		aria-label={$t('scaleControl.increaseFive')}>+5</Button
	>
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

		:global(input) {
			margin: 0;
			min-width: 5rem;
			text-align: center;
			font-weight: 600;
		}

		:global(button) {
			border-width: 0;
			justify-content: center;
			min-width: 3.25rem;
		}
	}
</style>
