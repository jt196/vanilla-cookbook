<script>
	let {
		id = '',
		name = '',
		label = '',
		value = $bindable(),
		options = [],
		disabled = false,
		class: className = '',
		...rest
	} = $props()
</script>

{#if label}
	<label for={id}>{label}</label>
{/if}
<select {id} {name} bind:value {disabled} class={className} {...rest}>
	{#each options as option}
		<option value={option.value} selected={option.value === value}>
			{option.label}
		</option>
	{/each}
</select>

<style>
	/* Select inherits PicoCSS select styles */
	/* No additional styles needed */
</style>
