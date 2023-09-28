<script>
	export let isExpanded
	export let height = '20px'
</script>

<svg
	class="chevron"
	style={`transform: rotate(${isExpanded ? '-90deg' : '0deg'});`}
	xmlns="http://www.w3.org/2000/svg"
	{height}
	viewBox="0 0 512 512">
	<!-- SVG path for the chevron pointing down -->
	<path
		d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
</svg>

<style>
	.chevron {
		transition: transform 0.3s ease-in-out;
	}
</style>
