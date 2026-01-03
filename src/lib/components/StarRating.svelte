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

<div class="flex">
	{#each [1, 2, 3, 4, 5] as star (star)}
		<button
			class="btn btn-circle btn-ghost btn-sm p-0 min-h-0 h-auto"
			class:opacity-40={rating < star - 0.5}
			class:hover:opacity-100={rating < star - 0.5}
			class:opacity-100={rating >= star - 0.5}
			class:text-warning={rating >= star - 0.5}
			onclick={(event) => {
				event.preventDefault()
				setRating(star)
			}}
			onkeydown={(event) => handleKeydown(event, star)}
			tabindex="0">
			<Star
				state={rating >= star ? 'full' : rating >= star - 0.5 ? 'half' : 'empty'}
				fill="currentColor" />
		</button>
	{/each}
</div>
