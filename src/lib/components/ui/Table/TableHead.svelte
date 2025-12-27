<script>
	let { class: className = '', children } = $props()
</script>

<thead class={className}>
	{@render children()}
</thead>
