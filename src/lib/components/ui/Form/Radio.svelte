<script>
	let {
		label = '',
		value = '',
		group = $bindable(''),
		name = '',
		checked = false,
		disabled = false,
		class: className = '',
		onchange = undefined
	} = $props()

	function handleChange(event) {
		group = event.target.value
		if (onchange) {
			onchange(group)
		}
	}
</script>

<label class={className}>
	<input
		type="radio"
		{name}
		{value}
		{checked}
		{disabled}
		bind:group
		onchange={handleChange}
	/>
	{label}
</label>

<style>
	/* Radio inherits PicoCSS label and input styles */
	/* No additional styles needed */
</style>
