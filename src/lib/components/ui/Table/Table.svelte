<script>
	let {
		striped = false,
		hoverable = false,
		class: className = '',
		children
	} = $props()
</script>

<table class={className}>
	{@render children()}
</table>

<style>
	/* Table inherits PicoCSS styles by default */
	/* No additional styles needed */
</style>
