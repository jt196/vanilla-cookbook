<script>
	let {
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
		fullWidth = true,
		legend = '',
		optionalLabel = '',
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

	// Treat legacy label usage as legend fallback
	const legendText = $derived(legend)

	const classes = $derived(
		['checkbox', colorClasses[color], sizeClasses[size], className].filter(Boolean).join(' ')
	)
</script>

{#if legend}
	<fieldset class={`fieldset bg-base-100 border-base-300 rounded-box border p-4 ${fullWidth ? 'w-full' : ''}`}>
		<legend class="fieldset-legend">{legendText}</legend>
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
				{legendText}
			{/if}
		</label>
		{#if optionalLabel}
			<span class="label">{optionalLabel}</span>
		{/if}
	</fieldset>
{:else}
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
			{legendText}
		{/if}
	</label>
{/if}
