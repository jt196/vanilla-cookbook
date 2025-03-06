<script>
	/** @type {{otherPhotos?: any, recipeName?: string}} */
	let { otherPhotos = [], recipeName = '' } = $props();
</script>

<div class="other-photos">
	{#if otherPhotos.length > 0}
		{#each otherPhotos as photo (photo.id)}
			<img src="/api/recipe/image/{photo.id}" alt="{recipeName} photo" />
		{/each}
	{/if}
</div>

<style lang="scss">
	.other-photos {
		margin: 1rem 0 2rem 0;
		img {
			max-height: 150px;
			margin-right: 1rem;
		}
	}
</style>
