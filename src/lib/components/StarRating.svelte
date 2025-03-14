<script>
	import Star from '$lib/components/svg/Star.svelte'

	/** @type {{rating?: number, editable?: boolean, ratingChanged?: (rating: number) => void}} */
	let { rating = 0, editable = false, ratingChanged } = $props()

	function setRating(value) {
		if (editable) {
			let newRating = rating === value - 0.5 ? value : value - 0.5
			ratingChanged?.(newRating) // Call function instead of modifying rating
		}
	}

	function handleKeydown(event, star) {
		if (editable && event.key === 'Enter') {
			setRating(star)
		}
	}
</script>

<div>
	{#each [1, 2, 3, 4, 5] as star (star)}
		<button
			class="star {editable ? 'editable' : ''}"
			onclick={(event) => {
				event.preventDefault()
				setRating(star)
			}}
			onkeydown={(event) => handleKeydown(event, star)}
			tabindex="0">
			<Star
				state={rating >= star ? 'full' : rating >= star - 0.5 ? 'half' : 'empty'}
				fill="var(--pico-primary)" />
		</button>
	{/each}
</div>

<style>
	.editable {
		cursor: pointer;
	}

	button.star {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		outline: none; /* Be cautious with this; you might want to provide a custom focus style */
	}
</style>
