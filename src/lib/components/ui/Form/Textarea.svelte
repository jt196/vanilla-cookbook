<script>
	let {
		id = '',
		name = '',
		label = '',
		value = $bindable(''),
		rows = 5,
		placeholder = '',
		required = false,
		disabled = false,
		class: className = '',
		...rest
	} = $props()
</script>

{#if label}
	<label for={id}>{label}</label>
{/if}
<textarea
	{id}
	{name}
	{rows}
	{placeholder}
	{required}
	{disabled}
	bind:value
	class={className}
	{...rest}></textarea>
