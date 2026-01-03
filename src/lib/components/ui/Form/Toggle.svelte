<script>
	let {
		id = '',
		name = '',
		checked = $bindable(false),
		label = '',
		size = 'md', // xs, sm, md, lg
		color = 'primary',
		disabled = false,
		class: className = ''
	} = $props()

	const sizeClasses = {
		xs: 'toggle-xs',
		sm: 'toggle-sm',
		md: 'toggle-md',
		lg: 'toggle-lg'
	}

	const colorClasses = {
		primary: 'toggle-primary',
		secondary: 'toggle-secondary',
		accent: 'toggle-accent',
		success: 'toggle-success',
		warning: 'toggle-warning',
		info: 'toggle-info',
		error: 'toggle-error'
	}

	const classes = $derived(
		['toggle', sizeClasses[size], colorClasses[color], className].filter(Boolean).join(' ')
	)
</script>

<label class="flex items-center gap-2 cursor-pointer">
	<input type="checkbox" {id} {name} class={classes} bind:checked {disabled} />
	{#if label}
		<span class="label-text">{label}</span>
	{/if}
</label>
