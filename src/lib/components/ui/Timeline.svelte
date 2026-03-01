<script>
	let { children } = $props()
</script>

<ul class="timeline timeline-vertical">
	{@render children?.()}
</ul>
