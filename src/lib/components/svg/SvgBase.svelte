<script>
	/** @type {{width?: string, height?: string, fill?: string, stroke?: string, strokeWidth?: string, viewBox?: string, class?: string}} */
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

	const computedAriaHidden = ariaHidden ?? (title ? undefined : 'true')
	const computedRole = role ?? (title ? 'img' : 'presentation')
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	{width}
	{height}
	{fill}
	viewBox={viewBox}
	class={className}
	style={style}
	aria-hidden={computedAriaHidden}
	role={computedRole}
	{stroke}
	stroke-width={strokeWidth}>
	{#if title}
		<title>{title}</title>
	{/if}
	{@render children?.()}
</svg>
