<script>
	/**
	 * @typedef {number} Scale
	 */

	/** @type {Scale} */
	export let scale = 1

	/**
	 * Increases the scale value by 0.5 when the current value is less than 5.
	 * Otherwise, increases it by 1.
	 */
	let increaseNum = () => {
		if (scale >= 5) {
			scale += 1
		} else {
			scale += 0.5
		}
	}

	/**
	 * Decreases the scale value by half (0.5) when the current value is between 1 and 5 (inclusive).
	 * For values greater than 5, it decreases the scale by 1.
	 * If the scale is at 1, it sets the scale to 0.5 to avoid going below 0.5.
	 */
	function decreaseNum() {
		if (scale === 1) {
			scale = 0.5
		} else if (scale > 1 && scale <= 5) {
			scale -= 0.5
		} else if (scale > 5) {
			scale -= 1
		}
	}

	function handleInput(event) {
		let value = parseFloat(event.target.value)
		if (isNaN(value) || value < 0) {
			value = 1 // Default to the minimum value if input is invalid
		}
		scale = value
	}
</script>

<div class="scale">
	<button on:click={increaseNum}>+</button>
	<input type="number" bind:value={scale} min="0.1" on:input={handleInput} />
	<button on:click={decreaseNum}>-</button>
</div>

<style lang="scss">
	.scale {
		display: flex;
		max-width: 20%;
		gap: 1rem;
		margin: 1rem 0 1rem 0;
		input {
			margin: 0;
			min-width: 3rem;
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
