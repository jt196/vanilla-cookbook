<script>
	/**
	 * DaisyUI Button Component
	 * Matches DaisyUI button API with size, style, and color variants
	 */
	let {
		/**
		 * Size variant
		 * @type {'xs' | 'sm' | 'md' | 'lg' | 'xl'}
		 */
		size = 'md',
		/**
		 * Style variant
		 * @type {'standard' | 'outline' | 'soft' | 'dash' | 'ghost' | 'link'}
		 */
		style = 'standard',
		/**
		 * Color variant
		 * @type {'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'}
		 */
		color = 'primary',
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
		'aria-label': ariaLabel = undefined,
		children
	} = $props()

	// Build DaisyUI classes
	const sizeClasses = {
		xs: 'btn-xs',
		sm: 'btn-sm',
		md: 'btn-md',
		lg: 'btn-lg',
		xl: 'btn-xl'
	}

	const styleClasses = {
		standard: '',
		outline: 'btn-outline',
		soft: 'btn-soft',
		dash: 'btn-dash',
		ghost: 'btn-ghost',
		link: 'btn-link'
	}

	const colorClasses = {
		neutral: 'btn-neutral',
		primary: 'btn-primary',
		secondary: 'btn-secondary',
		accent: 'btn-accent',
		info: 'btn-info',
		success: 'btn-success',
		warning: 'btn-warning',
		error: 'btn-error'
	}

	const classes = $derived(
		['btn', colorClasses[color], styleClasses[style], sizeClasses[size], className]
			.filter(Boolean)
			.join(' ')
	)
</script>

<button
	{type}
	{id}
	{disabled}
	{formaction}
	aria-busy={loading}
	aria-label={ariaLabel}
	class={classes}
	{onclick}>
	<!-- In DaisyUI 5 `loading` is the spinner element itself, never a class on the button -->
	{#if loading}
		<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
	{/if}
	{@render children()}
</button>
