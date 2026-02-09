<script>
	import SvgBase from '$lib/components/svg/SvgBase.svelte'

	/** @type {{width?: string, height?: string, fill?: string, isPublic?: boolean}} */
	let { width = '20px', height = '20px', fill = 'currentColor', isPublic = true } = $props()
</script>

<SvgBase {width} {height} {fill} viewBox="0 0 512 512">
	{#if isPublic}
		<!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
		<path
			d="M352 144c0-44.2 35.8-80 80-80s80 35.8 80 80l0 48c0 17.7 14.3 32 32 32s32-14.3 32-32l0-48C576 64.5 511.5 0 432 0S288 64.5 288 144l0 48L64 192c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-192c0-35.3-28.7-64-64-64l-32 0 0-48z" />
	{:else}
		<!--!Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
		<path
			d="M80 160V96C80 43 123 0 176 0s96 43 96 96v64h-32V96c0-35.3-28.7-64-64-64s-64 28.7-64 64v64H80zM0 224c0-35.3 28.7-64 64-64h256c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V224z" />
	{/if}
</SvgBase>
