<script>
	import { createEventDispatcher } from 'svelte'

	let {
		id = '',
		name = '',
		label = '',
		accept = '*/*',
		multiple = false,
		required = false,
		/**
		 * @type {'xs' | 'sm' | 'md' | 'lg' | 'xl'}
		 */
		size = 'md',
		/**
		 * @type {'neutral' | 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error'}
		 */
		color = 'primary',
		/**
		 * @type {'standard' | 'ghost'}
		 */
		style: styleVariant = 'standard',
		fullWidth = true,
		legend = '',
		optionalLabel = '',
		class: className = ''
	} = $props()

	const sizeClasses = {
		xs: 'file-input-xs',
		sm: 'file-input-sm',
		md: 'file-input-md',
		lg: 'file-input-lg',
		xl: 'file-input-xl'
	}

	const colorClasses = {
		neutral: 'file-input-neutral',
		primary: 'file-input-primary',
		secondary: 'file-input-secondary',
		accent: 'file-input-accent',
		info: 'file-input-info',
		success: 'file-input-success',
		warning: 'file-input-warning',
		error: 'file-input-error'
	}

	const styleClasses = {
		standard: '',
		ghost: 'file-input-ghost'
	}

	const classes = $derived(
		[
			'file-input',
			styleClasses[styleVariant],
			colorClasses[color],
			sizeClasses[size],
			fullWidth ? 'w-full' : '',
			className
		]
			.filter(Boolean)
			.join(' ')
	)

	const dispatch = createEventDispatcher()
</script>

{#if legend}
	<fieldset class={`fieldset ${fullWidth ? 'w-full' : ''}`}>
		<legend class="fieldset-legend">{legend}</legend>
		<input type="file" {id} {name} {accept} {multiple} {required} class={classes} />
		{#if optionalLabel}
			<label class="label">{optionalLabel}</label>
		{/if}
	</fieldset>
{:else}
	<div class={`form-control ${fullWidth ? 'w-full' : ''}`}>
		{#if label}
			<label class="label">
				<span class="label-text">{label}</span>
			</label>
		{/if}
		<input
			type="file"
			{id}
			{name}
			{accept}
			{multiple}
			{required}
			class={classes}
			on:change={(event) => dispatch('change', event)} />
		{#if optionalLabel}
			<label class="label">
				<span class="label-text-alt text-xs">{optionalLabel}</span>
			</label>
		{/if}
	</div>
{/if}
