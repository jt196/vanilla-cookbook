<script>
	import SvgBase from '$lib/components/svg/SvgBase.svelte'

	/** @type {{width?: string, height?: string, fill?: string}} */
	let { width = '20px', height = '20px', fill = 'currentColor' } = $props()
</script>

<SvgBase {width} {height} {fill} viewBox="0 0 448 512">
	<!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path
		d="M8 256a56 56 0 1 1 112 0A56 56 0 1 1 8 256zm160 0a56 56 0 1 1 112 0 56 56 0 1 1 -112 0zm216-56a56 56 0 1 1 0 112 56 56 0 1 1 0-112z" />
</SvgBase>
