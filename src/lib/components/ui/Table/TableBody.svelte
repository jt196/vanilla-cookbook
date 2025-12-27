<script>
	let { class: className = '', children } = $props()
</script>

<tbody class={className}>
	{@render children()}
</tbody>
