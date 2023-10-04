<script>
	export let recipe
	export let imageExists
</script>

{#if recipe.image_url && imageExists}
	<img
		class="recipe-thumbnail"
		loading="lazy"
		src={recipe.image_url}
		alt="{recipe.image_url} thumbnail" />
{/if}

<style lang="scss">
	.recipe-thumbnail {
		width: 100px;
		height: auto;
		object-fit: cover;
		display: block;
	}
</style>
