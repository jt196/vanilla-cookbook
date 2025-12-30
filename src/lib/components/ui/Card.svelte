<script>
	let {
		class: className = '',
		/**
		 * @type {'xs' | 'sm' | 'md' | 'lg' | 'xl'}
		 */
		size = 'md',
		bordered = false,
		dashed = false,
		side = false,
		imageFull = false,
		figure = undefined,
		figureClass = '',
		title = undefined,
		actions = undefined,
		children = undefined
	} = $props()

	const sizeClasses = {
		xs: 'card-xs',
		sm: 'card-sm',
		md: 'card-md',
		lg: 'card-lg',
		xl: 'card-xl'
	}

	const cardClasses = $derived(
		[
			'card bg-base-100 shadow-sm',
			sizeClasses[size],
			bordered ? 'card-border' : '',
			dashed ? 'card-dash' : '',
			side ? 'card-side' : '',
			imageFull ? 'image-full' : '',
			className
		]
			.filter(Boolean)
			.join(' ')
	)
</script>

<div class={cardClasses}>
	{#if figure}
		<figure class={figureClass}>{@render figure()}</figure>
	{/if}
	<div class="card-body">
		{#if title}
			<h2 class="card-title">{@render title()}</h2>
		{/if}
		{@render children?.()}
		{#if actions}
			<div class="card-actions justify-end">
				{@render actions()}
			</div>
		{/if}
	</div>
</div>
