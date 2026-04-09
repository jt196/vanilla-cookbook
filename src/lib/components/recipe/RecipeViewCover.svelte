<script>
	import { t } from '$lib/stores/locale.js'
	/** @type {{mainPhoto: any, recipe: any}} */
	let { mainPhoto, recipe } = $props()

	let showOverlay = $state(false)

	function toggleOverlay() {
		showOverlay = !showOverlay
	}
</script>

<div>
	{#if mainPhoto}
		<button
			type="button"
			class="cover-container"
			aria-label={$t('photos.photoAlt', { name: recipe.name })}
			onmouseenter={() => (showOverlay = true)}
			onmouseleave={() => (showOverlay = false)}
			onclick={toggleOverlay}
		>
			<img
				src="/api/recipe/image/{mainPhoto.id}"
				alt={$t('photos.photoAlt', { name: recipe.name })}
				class="w-full h-auto max-h-[400px] md:max-h-[400px] max-md:max-h-[250px] object-cover block rounded-2xl"
			/>
			{#if mainPhoto.notes}
				<div class="cover-overlay" class:visible={showOverlay}>
					<p class="cover-notes">{mainPhoto.notes}</p>
				</div>
			{/if}
		</button>
	{:else if recipe.image_url}
		<img
			src={recipe.image_url}
			alt={$t('photos.photoAlt', { name: recipe.name })}
			class="w-full h-auto max-h-[400px] md:max-h-[400px] max-md:max-h-[250px] object-cover block rounded-2xl"
		/>
	{/if}
</div>

<style>
	.cover-container {
		position: relative;
		cursor: pointer;
		display: block;
		width: 100%;
		padding: 0;
		border: 0;
		background: transparent;
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
