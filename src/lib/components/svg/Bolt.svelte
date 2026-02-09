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
		d="M13 10V3L4 14h7v7l9-11h-7z" />
</svg>
