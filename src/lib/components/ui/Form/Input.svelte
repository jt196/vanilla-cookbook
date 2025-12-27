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
</script>

{#if label}
	<label for={id}>{label}</label>
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
	class={className}
	aria-invalid={error ? 'true' : undefined}
/>
{#if error}
	<small class="error">{error}</small>
{/if}

<style>
	/* Input inherits PicoCSS styles */
	.error {
		color: var(--pico-del-color);
	}
</style>
