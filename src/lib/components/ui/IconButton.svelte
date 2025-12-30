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
	class="btn btn-ghost btn-circle {className}"
	{...rest}>
	{@render children()}
</button>
