<script>
	import SvgBase from '$lib/components/svg/SvgBase.svelte'

	/** @type {{width?: string, height?: string, stroke?: string, strokeWidth?: string}} */
	let { width = '16px', height = '16px', stroke = 'currentColor', strokeWidth = '2' } = $props()
</script>

<SvgBase {width} {height} fill="none" {stroke} strokeWidth={strokeWidth} viewBox="0 0 24 24">
	<path
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-width={strokeWidth}
		d="M13 10V3L4 14h7v7l9-11h-7z" />
</SvgBase>
