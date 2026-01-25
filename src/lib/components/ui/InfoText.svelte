<script>
	/** @type {{class?: string, children?: any}} */
	let { class: className = '', children } = $props()
</script>

<p class="text-xs text-base-content/60 {className}">
	{@render children?.()}
</p>
