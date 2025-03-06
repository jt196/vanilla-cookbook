<script>
	/**
	 * @typedef {number} Scale
	 */

	/** @type {{scale?: Scale}} */
	let { scale = 1, onScaleChange } = $props()

	/**
	 * Increases the scale value by 0.5 when the current value is less than 5.
	 * Otherwise, increases it by 1.
	 */
	function increaseNum() {
		const newScale = scale >= 5 ? scale + 1 : scale + 0.5
		onScaleChange && onScaleChange(newScale)
	}

	/**
	 * Decreases the scale value by half (0.5) when the current value is between 1 and 5 (inclusive).
	 * For values greater than 5, it decreases the scale by 1.
	 * If the scale is at 1, it sets the scale to 0.5 to avoid going below 0.5.
	 */
	function decreaseNum() {
		let newScale
		if (scale === 1) {
			newScale = 0.5
		} else if (scale > 1 && scale <= 5) {
			newScale = scale - 0.5
		} else if (scale > 5) {
			newScale = scale - 1
		}
		onScaleChange && onScaleChange(newScale)
	}

	function handleInput(event) {
		const value = parseFloat(event.target.value)
		if (isNaN(value)) return
		onScaleChange && onScaleChange(value)
	}
</script>

<div class="scale">
	<button onclick={decreaseNum}>-</button>
	<input type="number" value={scale} min="0.1" oninput={handleInput} />
	<button onclick={increaseNum}>+</button>
</div>

<style lang="scss">
	.scale {
		display: flex;
		max-width: 100%;
		gap: 1rem;
		margin: 1rem 0 1rem 0;
		input {
			margin: 0;
			min-width: 5rem;
		}
		button {
			border-width: 0px;
			justify-content: center;
			display: block;
			width: 50%;
			margin: 0 auto;
		}
	}
</style>
