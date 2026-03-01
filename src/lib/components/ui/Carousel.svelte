<script>
	/** @type {{ children?: import('svelte').Snippet, class?: string }} */
	let { children, class: className = '' } = $props()
</script>

<div class={['carousel carousel-center w-full gap-4 px-4', className].filter(Boolean).join(' ')}>
	{@render children?.()}
</div>
