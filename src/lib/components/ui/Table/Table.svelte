<script>
	const sizeClass = {
		xs: 'table-xs',
		sm: 'table-sm',
		md: 'table-md',
		lg: 'table-lg',
		xl: 'table-xl'
	}

	let {
		/**
		 * DaisyUI size modifier
		 * @type {'xs' | 'sm' | 'md' | 'lg' | 'xl'}
		 */
		size = 'md',
		/** Zebra stripe rows */
		zebra = false,
		/** Backwards compatibility alias for zebra */
		striped = false,
		/** Stick header/footer rows */
		pinRows = false,
		/** Stick left/right columns */
		pinCols = false,
		/** Add rounded border/background wrapper */
		bordered = false,
		/** Optional wrapper class */
		containerClass = '',
		/** Extra classes on table */
		class: className = '',
		children
	} = $props()

	const tableClass = [
		'table',
		sizeClass[size] ?? '',
		zebra || striped ? 'table-zebra' : '',
		pinRows ? 'table-pin-rows' : '',
		pinCols ? 'table-pin-cols' : '',
		className
	]
		.filter(Boolean)
		.join(' ')

	const wrapperClass = [
		'overflow-x-auto',
		bordered ? 'rounded-box border border-base-300 bg-base-100' : '',
		containerClass
	]
		.filter(Boolean)
		.join(' ')
</script>

<div class={wrapperClass}>
	<table class={tableClass}>
		{@render children()}
	</table>
</div>
