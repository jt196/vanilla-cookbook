<script>
	/** @type {{mainPhoto: any, recipe: any}} */
	let { mainPhoto, recipe } = $props()

	let showOverlay = $state(false)

	function toggleOverlay() {
		showOverlay = !showOverlay
	}
</script>

<div>
	{#if mainPhoto}
		<div
			class="cover-container"
			role="img"
			aria-label="{recipe.name} photo"
			onmouseenter={() => (showOverlay = true)}
			onmouseleave={() => (showOverlay = false)}
			onclick={toggleOverlay}>
			<img
				src="/api/recipe/image/{mainPhoto.id}"
				alt="{recipe.name} photo"
				class="w-full h-auto max-h-[400px] md:max-h-[400px] max-md:max-h-[250px] object-cover block rounded-2xl" />
			{#if mainPhoto.notes}
				<div class="cover-overlay" class:visible={showOverlay}>
					<p class="cover-notes">{mainPhoto.notes}</p>
				</div>
			{/if}
		</div>
	{:else if recipe.image_url}
		<img
			src={recipe.image_url}
			alt="{recipe.name} photo"
			class="w-full h-auto max-h-[400px] md:max-h-[400px] max-md:max-h-[250px] object-cover block rounded-2xl" />
	{/if}
</div>

<style>
	.cover-container {
		position: relative;
		cursor: pointer;
	}

	.cover-overlay {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
		padding: 2rem 1rem 1rem;
		border-radius: 0 0 1rem 1rem;
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	.cover-overlay.visible {
		opacity: 1;
	}

	.cover-notes {
		color: white;
		font-size: 0.85rem;
		margin: 0;
		text-align: center;
	}
</style>
