<script>
	let {
		/**
		 * @type {'text' | 'password' | 'email' | 'number' | 'url'}
		 */
		type = 'text',
		label = '',
		value = $bindable(''),
		placeholder = '',
		error = '',
		/**
		 * Size variant
		 * @type {'xs' | 'sm' | 'md' | 'lg' | 'xl' | undefined}
		 */
		size = undefined,
		/**
		 * Color variant
		 * @type {'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | undefined}
		 */
		color = undefined,
		/**
		 * Style variant
		 * @type {'bordered' | 'ghost' | undefined}
		 */
		style: styleVariant = undefined,
		fullWidth = true,
		/**
		 * Use the label as a placeholder when none is provided
		 */
		useLabelAsPlaceholder = false,
		required = false,
		disabled = false,
		id = '',
		name = '',
		class: className = '',
		oninput = undefined
	} = $props()

	function handleInput(event) {
		value = event.target.value
		if (oninput) {
			oninput(event)
		}
	}

	const sizeClasses = {
		xs: 'input-xs',
		sm: 'input-sm',
		md: 'input-md',
		lg: 'input-lg',
		xl: 'input-xl'
	}

	const colorClasses = {
		neutral: 'input-neutral',
		primary: 'input-primary',
		secondary: 'input-secondary',
		accent: 'input-accent',
		info: 'input-info',
		success: 'input-success',
		warning: 'input-warning',
		error: 'input-error'
	}

	const styleClasses = {
		bordered: 'input-bordered',
		ghost: 'input-ghost'
	}

	const baseClasses = $derived(
		[
			styleVariant ? styleClasses[styleVariant] : '',
			error ? 'input-error' : color ? colorClasses[color] : '',
			size ? sizeClasses[size] : '',
			fullWidth ? 'w-full' : '',
			className
		]
			.filter(Boolean)
			.join(' ')
	)

	const wrapperClasses = $derived(['input', baseClasses].filter(Boolean).join(' '))
	const standaloneClasses = $derived(['input', baseClasses].filter(Boolean).join(' '))

	const placeholderValue = $derived(placeholder || (useLabelAsPlaceholder && label ? label : ''))
</script>

<div class={`form-control mb-2 ${fullWidth ? 'w-full' : ''}`}>
	{#if label}
		<label class={wrapperClasses}>
			{label}
			<input
				class="grow"
				{type}
				{id}
				{name}
				placeholder={placeholderValue}
				{required}
				{disabled}
				bind:value
				oninput={handleInput}
				aria-invalid={error ? 'true' : undefined} />
		</label>
	{:else}
		<input
			{type}
			{id}
			{name}
			placeholder={placeholderValue}
			{required}
			{disabled}
			bind:value
			oninput={handleInput}
			class={standaloneClasses}
			aria-invalid={error ? 'true' : undefined} />
	{/if}
	{#if error}
		<p class="validator-hint text-error mt-1" role="alert">{error}</p>
	{/if}
</div>
