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

	const inputClasses = $derived(
		[
			'input input-bordered w-full',
			error ? 'input-error' : '',
			className
		]
			.filter(Boolean)
			.join(' ')
	)
</script>

<div class="form-control w-full">
	{#if label}
		<label for={id} class="label">
			<span class="label-text">{label}</span>
		</label>
	{/if}
	<input
		{type}
		{id}
		{name}
		{placeholder}
		{required}
		{disabled}
		bind:value
		oninput={handleInput}
		class={inputClasses}
		aria-invalid={error ? 'true' : undefined}
	/>
	{#if error}
		<label class="label">
			<span class="label-text-alt text-error">{error}</span>
		</label>
	{/if}
</div>
