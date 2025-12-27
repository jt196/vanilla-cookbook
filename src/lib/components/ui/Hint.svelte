<script>
	let {
		/**
		 * @type {string}
		 */
		text = '',
		/**
		 * @type {import('svelte').Snippet}
		 */
		children
	} = $props()
</script>

{#if text || children}
	<p class="hint">
		{#if children}
			{@render children()}
		{:else}
			{text}
		{/if}
	</p>
{/if}

<style>
	.hint {
		margin: 0.5rem 0 1rem 0;
		font-size: 0.9rem;
		opacity: 0.8;
	}
</style>
