<script>
	let {
		label = '',
		checked = $bindable(false),
		disabled = false,
		name = '',
		/**
		 * @type {'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'}
		 */
		color = 'accent',
		/**
		 * @type {'xs' | 'sm' | 'md' | 'lg' | 'xl'}
		 */
		size = 'md',
		class: className = '',
		onchange = undefined,
		children
	} = $props()

	function handleChange(event) {
		checked = event.target.checked
		if (onchange) {
			onchange(checked)
		}
	}

	const sizeClasses = {
		xs: 'checkbox-xs',
		sm: 'checkbox-sm',
		md: 'checkbox-md',
		lg: 'checkbox-lg',
		xl: 'checkbox-xl'
	}

	const colorClasses = {
		neutral: 'checkbox-neutral',
		primary: 'checkbox-primary',
		secondary: 'checkbox-secondary',
		accent: 'checkbox-accent',
		info: 'checkbox-info',
		success: 'checkbox-success',
		warning: 'checkbox-warning',
		error: 'checkbox-error'
	}

	const classes = $derived(
		['checkbox', colorClasses[color], sizeClasses[size], className].filter(Boolean).join(' ')
	)
</script>

<label class={`flex items-center gap-2 ${className}`}>
	<input
		type="checkbox"
		class={classes}
		{name}
		{disabled}
		bind:checked
		onchange={handleChange}
	/>
	{#if children}
		{@render children()}
	{:else}
		{label}
	{/if}
</label>

<style>
	/* Checkbox inherits PicoCSS label and input styles */
	/* No additional styles needed */
</style>
