<script>
	/** @type {{ children?: import('svelte').Snippet }} */
	let { children } = $props()
</script>

<div class="carousel-item">
	{@render children?.()}
</div>
