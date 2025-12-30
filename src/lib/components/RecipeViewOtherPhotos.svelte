<script>
	/** @type {{otherPhotos?: any, recipeName?: string}} */
	let { otherPhotos = [], recipeName = '' } = $props();
</script>

{#if otherPhotos.length > 0}
	<div class="my-4 mb-8 flex flex-wrap gap-4">
		{#each otherPhotos as photo (photo.id)}
			<img
				src="/api/recipe/image/{photo.id}"
				alt="{recipeName} photo"
				class="max-h-[150px] rounded-lg object-cover" />
		{/each}
	</div>
{/if}
