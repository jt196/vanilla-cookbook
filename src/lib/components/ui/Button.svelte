<script>
	/**
	 * @type {'primary' | 'secondary' | 'outline' | 'ghost'}
	 */
	let {
		variant = 'primary',
		/**
		 * @type {'sm' | 'md' | 'lg'}
		 */
		size = 'md',
		disabled = false,
		loading = false,
		/**
		 * @type {'button' | 'submit' | 'reset'}
		 */
		type = 'button',
		id = '',
		formaction = undefined,
		class: className = '',
		onclick = undefined,
		children
	} = $props()
</script>

<button
	{type}
	{id}
	{disabled}
	formaction={formaction}
	aria-busy={loading}
	class={className}
	{onclick}
>
	{@render children()}
</button>

<style>
	/* Button component inherits PicoCSS styles by default */
	/* No additional styles needed - PicoCSS handles button styling */
</style>
