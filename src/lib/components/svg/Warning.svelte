<script>
	import SvgBase from '$lib/components/svg/SvgBase.svelte'

	/** @type {{width?: string, height?: string, fill?: string}} */
	let { width = '20px', height = '20px', fill = 'currentColor' } = $props()
</script>

<SvgBase {width} {height} {fill} viewBox="0 0 512 512">
	<!--!Font Awesome Free 6.5.1 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc.--><path
		d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z" />
</SvgBase>
