<!-- StarRating.svelte -->
<script>
	export let rating = 0
</script>

{#each [1, 2, 3, 4, 5] as star}
	<span class="star {star <= rating ? 'active' : ''}">★</span>
{/each}

<style>
	.star {
		font-size: 24px;
		color: var(--pico-text-selection-color);
	}

	.active {
		color: #ffd700; /* Bright color for active star */
	}
</style>
