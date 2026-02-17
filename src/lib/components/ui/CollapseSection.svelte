<script>
	/** @type {{ title?: string, open?: boolean, className?: string, children?: import('svelte').Snippet }} */
	let { title = '', open = false, className = '', children = undefined } = $props()
</script>

<div class={`collapse collapse-arrow bg-base-100 border border-base-300 ${className}`.trim()}>
	<input type="checkbox" checked={open} />
	<div class="collapse-title font-semibold">{title}</div>
	<div class="collapse-content text-sm">
		{@render children?.()}
	</div>
</div>
