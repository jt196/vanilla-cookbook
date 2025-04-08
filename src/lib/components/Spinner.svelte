<!-- Spinner.svelte -->
<script>
	import { fade } from 'svelte/transition'

	// In Svelte 5, we can get props via $props
	let { visible = false, spinnerContent = 'Loading', transitionTime = '300' } = $props()
</script>

{#if visible}
	<div class="overlay" aria-busy="true" transition:fade={{ duration: transitionTime }}>
		{spinnerContent}
	</div>
{/if}

<style>
	.overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: var(--pico-background-color, rgba(0, 0, 0, 0.5)); /* fallback: 50% opacity black */
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--pico-color, white);
		font-size: 2em;
	}
</style>
