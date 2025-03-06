<script>
	/** @type {{recipe: any, imageExists: any}} */
	let { recipe, imageExists } = $props();
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
