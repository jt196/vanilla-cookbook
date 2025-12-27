<script>
	let {
		/**
		 * @type {'sm' | 'md' | 'lg' | 'xl' | 'full'}
		 */
		size = 'md',
		class: className = '',
		children
	} = $props()
</script>

<div class="container {className}">
	{@render children()}
</div>

<style>
	/* Container inherits PicoCSS .container styles */
	/* No additional styles needed */
</style>
