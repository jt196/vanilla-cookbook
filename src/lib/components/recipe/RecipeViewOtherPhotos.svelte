<script>
	/** @type {{otherPhotos?: any, recipeName?: string, onSetMainPhoto?: (photoId: string) => void, viewOnly?: boolean}} */
	let { otherPhotos = [], recipeName = '', onSetMainPhoto, viewOnly = false } = $props()
</script>

{#if otherPhotos.length > 0}
	<div class="my-4 mb-8 flex flex-wrap gap-4">
		{#each otherPhotos as photo (photo.id)}
			<div class="flex flex-col items-center">
				{#if onSetMainPhoto && !viewOnly}
					<button type="button" class="promote-btn" onclick={() => onSetMainPhoto(photo.id)}>
						<img
							src="/api/recipe/image/{photo.id}"
							alt="{recipeName} photo - click to set as main"
							class="max-h-[150px] rounded-lg object-cover opacity-80 hover:opacity-100 transition-opacity"
						/>
					</button>
				{:else}
					<img
						src="/api/recipe/image/{photo.id}"
						alt="{recipeName} photo"
						class="max-h-[150px] rounded-lg object-cover"
					/>
				{/if}
				{#if photo.notes}
					<p class="text-xs text-base-content/70 mt-1 text-center italic">{photo.notes}</p>
				{/if}
			</div>
		{/each}
	</div>
{/if}

<style>
	.promote-btn {
		all: unset;
		cursor: pointer;
		display: block;
	}
</style>
