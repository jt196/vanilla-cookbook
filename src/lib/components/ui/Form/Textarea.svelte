<script>
	let {
		id = '',
		name = '',
		label = '',
		legend = '',
		optionalLabel = '',
		value = $bindable(''),
		rows = 5,
		placeholder = '',
		required = false,
		disabled = false,
		fullWidth = true,
		size = 'md',
		color = 'accent',
		style: styleVariant = 'standard',
		class: className = '',
		...rest
	} = $props()

	// Use label as legend fallback
	$effect(() => {
		if (!legend && label) {
			legend = label
		}
	})

	const sizeClasses = {
		xs: 'textarea-xs',
		sm: 'textarea-sm',
		md: 'textarea-md',
		lg: 'textarea-lg',
		xl: 'textarea-xl'
	}

	const colorClasses = {
		neutral: 'textarea-neutral',
		primary: 'textarea-primary',
		secondary: 'textarea-secondary',
		accent: 'textarea-accent',
		info: 'textarea-info',
		success: 'textarea-success',
		warning: 'textarea-warning',
		error: 'textarea-error'
	}

	const styleClasses = {
		standard: '',
		ghost: 'textarea-ghost'
	}

	const textareaClass = $derived(
		[
			'textarea',
			'block',
			'max-w-full',
			'min-w-0',
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
	<fieldset class={`fieldset ${fullWidth ? 'w-full' : ''} max-w-full min-w-0`}>
		<legend class="fieldset-legend">{legend}</legend>
		<textarea
			{id}
			{name}
			{rows}
			{placeholder}
			{required}
			{disabled}
			bind:value
			class={textareaClass}
			style="min-width:0;max-width:100%;"
			{...rest}></textarea>
		{#if optionalLabel}
			<span class="label block whitespace-normal break-words text-sm leading-snug max-w-full">
				{optionalLabel}
			</span>
		{/if}
	</fieldset>
{:else}
	<div class={`form-control ${fullWidth ? 'w-full' : ''} max-w-full min-w-0`}>
		<textarea
			{id}
			{name}
			{rows}
			{placeholder}
			{required}
			{disabled}
			bind:value
			class={textareaClass}
			style="min-width:0;max-width:100%;"
			{...rest}></textarea>
	</div>
{/if}
