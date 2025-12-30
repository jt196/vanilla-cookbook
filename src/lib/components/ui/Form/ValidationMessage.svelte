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
		 * Hide when not showing (no space taken, causes layout shift)
		 */
		hidden = false
	} = $props()

	const typeClass = $derived(
		isValid ? 'text-success' : isError ? 'text-error' : 'text-info'
	)
</script>

{#if message}
	<p class="validator-hint {typeClass}" class:hidden>
		{message}
	</p>
{/if}
