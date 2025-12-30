<script>
	let {
		id = '',
		name = '',
		label = '',
		value = $bindable(),
		options = [],
		disabled = false,
		/**
		 * @type {'xs' | 'sm' | 'md' | 'lg' | 'xl'}
		 */
		size = 'md',
		/**
		 * @type {'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'}
		 */
		color = 'neutral',
		/**
		 * @type {'standard' | 'ghost'}
		 */
		style: styleVariant = 'standard',
		fullWidth = true,
		class: className = '',
		...rest
	} = $props()

	const sizeClasses = {
		xs: 'select-xs',
		sm: 'select-sm',
		md: 'select-md',
		lg: 'select-lg',
		xl: 'select-xl'
	}

	const colorClasses = {
		neutral: 'select-neutral',
		primary: 'select-primary',
		secondary: 'select-secondary',
		accent: 'select-accent',
		info: 'select-info',
		success: 'select-success',
		warning: 'select-warning',
		error: 'select-error'
	}

	const styleClasses = {
		standard: '',
		ghost: 'select-ghost'
	}

	const selectClasses = $derived(
		[
			'select',
			styleClasses[styleVariant],
			colorClasses[color],
			sizeClasses[size],
			fullWidth ? 'w-full' : '',
			className
		]
			.filter(Boolean)
			.join(' ')
	)
</script>

<div class={`form-control ${fullWidth ? 'w-full' : ''}`}>
	{#if label}
		<label class="label">
			<span class="label-text">{label}</span>
		</label>
	{/if}
	<select {id} {name} bind:value {disabled} class={selectClasses} {...rest}>
		{#each options as option}
			<option value={option.value} selected={option.value === value}>
				{option.label}
			</option>
		{/each}
	</select>
</div>
