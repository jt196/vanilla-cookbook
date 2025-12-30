<script>
	let {
		/**
		 * @type {Array<{ value: string, label: string }>}
		 */
		options = [],
		/**
		 * @type {string}
		 */
		name = '',
		/**
		 * @type {string}
		 */
		selected = $bindable(),
		/**
		 * @type {string}
		 */
		label = '',
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
		disabled = false,
		class: className = '',
		legend = '',
		optionalLabel = ''
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

{#if legend}
	<fieldset class={`fieldset ${fullWidth ? 'w-full' : ''}`}>
		<legend class="fieldset-legend">{legend}</legend>
		<select {name} bind:value={selected} {disabled} class={selectClasses}>
			{#each options as option}
				<option value={option.value} selected={option.value === selected}>
					{option.label}
				</option>
			{/each}
		</select>
		{#if optionalLabel}
			<span class="label">{optionalLabel}</span>
		{/if}
	</fieldset>
{:else}
	<div class={`form-control ${fullWidth ? 'w-full' : ''}`}>
		<select {name} bind:value={selected} {disabled} class={selectClasses}>
			{#each options as option}
				<option value={option.value} selected={option.value === selected}>
					{option.label}
				</option>
			{/each}
		</select>
	</div>
{/if}
