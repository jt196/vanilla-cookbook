<script>
	let { class: className = '', children } = $props()
</script>

<tr class={className}>
	{@render children()}
</tr>
