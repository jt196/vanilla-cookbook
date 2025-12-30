<script>
	/**
	 * @type {'primary' | 'secondary' | 'outline' | 'ghost' | 'accent'}
	 */
	let {
		variant = 'primary',
		/**
		 * @type {'xs' | 'sm' | 'md' | 'lg'}
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

	// Build DaisyUI classes
	const variantClasses = {
		primary: 'btn-primary',
		secondary: 'btn-secondary',
		outline: 'btn-outline',
		ghost: 'btn-ghost',
		accent: 'btn-accent'
	}

	const sizeClasses = {
		xs: 'btn-xs',
		sm: 'btn-sm',
		md: 'btn-md',
		lg: 'btn-lg'
	}

	const classes = $derived(
		[
			'btn',
			variantClasses[variant],
			sizeClasses[size],
			loading ? 'loading' : '',
			className
		]
			.filter(Boolean)
			.join(' ')
	)
</script>

<button
	{type}
	{id}
	{disabled}
	formaction={formaction}
	aria-busy={loading}
	class={classes}
	{onclick}
>
	{#if loading}
		<span class="loading loading-spinner"></span>
	{/if}
	{@render children()}
</button>
