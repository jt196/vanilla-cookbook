<script lang="ts">
	export let scale: number
	// TODO: #26 Make the scaling button quantities a bit more clever
	let increaseNum = () => (scale += 1)
	function decreaseNum() {
		if (scale === 1) {
			scale = 0.5
		} else {
			scale -= 1
		}
	}
</script>

<div class="scale">
	<button on:click={increaseNum}>+</button>
	<input bind:value={scale} min="0.1" />
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
