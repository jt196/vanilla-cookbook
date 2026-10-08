<script>
	let { class: className = '', children } = $props()
</script>

<div class="container {className}">
	{@render children()}
</div>

<style>
	/* Container inherits PicoCSS .container styles */
	/* No additional styles needed */
</style>
