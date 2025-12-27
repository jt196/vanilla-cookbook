<script>
	let {
		label = '',
		checked = $bindable(false),
		disabled = false,
		name = '',
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
</script>

<label class={className}>
	<input
		type="checkbox"
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
