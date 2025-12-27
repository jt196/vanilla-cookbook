<script>
	let {
		/**
		 * @type {string}
		 */
		id = '',
		/**
		 * @type {string}
		 */
		name = '',
		/**
		 * @type {string}
		 */
		label = '',
		/**
		 * @type {string}
		 */
		accept = '*/*',
		/**
		 * @type {boolean}
		 */
		multiple = false,
		/**
		 * @type {boolean}
		 */
		required = false,
		/**
		 * @type {(event: Event) => void}
		 */
		onchange = undefined,
		/**
		 * @type {string}
		 */
		class: className = ''
	} = $props()
</script>

{#if label}
	<label for={id}>{label}</label>
{/if}
<input
	type="file"
	{id}
	{name}
	{accept}
	{multiple}
	{required}
	{onchange}
	class={className} />
