<script>
	/** @type {{width?: string, height?: string, stroke?: string, strokeWidth?: string}} */
	let { width = '16px', height = '16px', stroke = 'currentColor', strokeWidth = '2' } = $props()
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	{width}
	{height}
	fill="none"
	viewBox="0 0 24 24"
	stroke={stroke}>
	<path
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-width={strokeWidth}
		d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
</svg>
