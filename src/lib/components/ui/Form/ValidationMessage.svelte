<script>
	let {
		/**
		 * @type {string | null}
		 */
		message = null,
		/**
		 * @type {boolean}
		 */
		isValid = false,
		/**
		 * @type {boolean}
		 */
		isError = false,
		/**
		 * @type {boolean}
		 * Force hide even when a message exists
		 */
		hidden = false
	} = $props()

	const typeClass = $derived(isValid ? 'text-success' : isError ? 'text-error' : 'text-info')
	const shouldHide = $derived(hidden || !message)
</script>

{#if message}
	<div
		class="validator-hint {typeClass}"
		class:hidden={shouldHide}
		style:visibility={shouldHide ? 'hidden' : 'visible'}
		role="alert">
		{message}
	</div>
{/if}
