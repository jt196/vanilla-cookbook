<script>
	import Star from '$lib/components/svg/Star.svelte'
	import { createEventDispatcher } from 'svelte'

	const dispatch = createEventDispatcher()

	export let rating = 0
	export let editable = false

	function setRating(value) {
		if (editable) {
			if (rating === value - 0.5) {
				rating = value
			} else {
				rating = value - 0.5
			}
			dispatch('ratingChanged', rating)
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
			on:click={(event) => {
				event.preventDefault()
				setRating(star)
			}}
			on:keydown={(event) => handleKeydown(event, star)}
			tabindex="0">
			<Star state={rating >= star ? 'full' : rating >= star - 0.5 ? 'half' : 'empty'} />
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
