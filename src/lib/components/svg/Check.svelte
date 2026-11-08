<script>
	import SvgBase from '$lib/components/svg/SvgBase.svelte'

	/** @type {{checked?: boolean, width?: string, height?: string, fill?: string}} */
	let { checked = false, width = '20px', height = '20px', fill = 'currentColor' } = $props()
</script>

<!--! Font Awesome Free 6.7.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free (Icons: CC BY 4.0) -->
{#if checked}
	<SvgBase {width} {height} {fill} viewBox="0 0 512 512">
		<path
			d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
	</SvgBase>
{:else}
	<SvgBase {width} {height} {fill} viewBox="0 0 512 512">
		<path
			d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-111 111-47-47c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l64 64c9.4 9.4 24.6 9.4 33.9 0L369 209z" />
	</SvgBase>
{/if}
