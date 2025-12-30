<script>
	/**
	 * DaisyUI Badge Component
	 * Matches DaisyUI badge API with size, style, and color variants
	 */
	let {
		/**
		 * Size variant
		 * @type {'xs' | 'sm' | 'md' | 'lg' | 'xl'}
		 */
		size = 'md',
		/**
		 * Style variant
		 * @type {'standard' | 'outline' | 'soft' | 'dash' | 'ghost'}
		 */
		style = 'standard',
		/**
		 * Color variant
		 * @type {'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'}
		 */
		color = undefined,
		class: className = '',
		children
	} = $props()

	// Build DaisyUI classes
	const sizeClasses = {
		xs: 'badge-xs',
		sm: 'badge-sm',
		md: 'badge-md',
		lg: 'badge-lg',
		xl: 'badge-xl'
	}

	const styleClasses = {
		standard: '',
		outline: 'badge-outline',
		soft: 'badge-soft',
		dash: 'badge-dash',
		ghost: 'badge-ghost'
	}

	const colorClasses = {
		neutral: 'badge-neutral',
		primary: 'badge-primary',
		secondary: 'badge-secondary',
		accent: 'badge-accent',
		info: 'badge-info',
		success: 'badge-success',
		warning: 'badge-warning',
		error: 'badge-error'
	}

	const classes = $derived(
		[
			'badge',
			color ? colorClasses[color] : '',
			styleClasses[style],
			sizeClasses[size],
			className
		]
			.filter(Boolean)
			.join(' ')
	)
</script>

<span class={classes}>
	{@render children()}
</span>
