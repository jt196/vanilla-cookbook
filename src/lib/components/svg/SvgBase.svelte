<script>
	/**
	 * Shared <svg> wrapper for icons. Decorative unless `title` is given, in which case it's
	 * exposed to screen readers as an image.
	 *
	 * @type {{width?: string, height?: string, fill?: string, stroke?: string, strokeWidth?: string | number, viewBox?: string, class?: string, style?: string, title?: string, ariaHidden?: 'true' | 'false', role?: string, children?: import('svelte').Snippet}}
	 */
	let {
		width,
		height,
		fill = 'currentColor',
		stroke,
		strokeWidth,
		viewBox = '0 0 24 24',
		class: className = '',
		style,
		title,
		ariaHidden,
		role,
		children
	} = $props()

	const computedAriaHidden = $derived(ariaHidden ?? (title ? undefined : 'true'))
	const computedRole = $derived(role ?? (title ? 'img' : 'presentation'))
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	{width}
	{height}
	{fill}
	{viewBox}
	class={className}
	{style}
	aria-hidden={computedAriaHidden}
	role={computedRole}
	{stroke}
	stroke-width={strokeWidth}>
	{#if title}
		<title>{title}</title>
	{/if}
	{@render children?.()}
</svg>
