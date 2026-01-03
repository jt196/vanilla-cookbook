<script>
	/** @type {{recipe: any, imageExists: any}} */
	let { recipe, imageExists } = $props();
</script>

{#if recipe.image_url && imageExists}
	<img
		class="w-32 h-auto object-cover rounded-lg shadow-md mb-4"
		loading="lazy"
		src={recipe.image_url}
		alt="{recipe.image_url} thumbnail" />
{/if}
