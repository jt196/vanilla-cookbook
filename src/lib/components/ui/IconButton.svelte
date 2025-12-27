<script>
	let {
		onclick = undefined,
		type = 'button',
		disabled = false,
		class: className = '',
		children,
		...rest
	} = $props()
</script>

<button
	type={type}
	disabled={disabled}
	onclick={onclick}
	class="icon-button {className}"
	{...rest}>
	{@render children()}
</button>

<style>
	.icon-button {
		background: none;
		border: none;
		color: none;
		outline: none;
		box-shadow: none;
		padding: 0.5rem;
	}
</style>
