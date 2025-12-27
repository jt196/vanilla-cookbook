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
		isError = false
	} = $props()
</script>

{#if message}
	<p class="validation-message" class:valid={isValid} class:error={isError}>
		{message}
	</p>
{/if}

<style>
	.validation-message {
		margin-top: -0.75rem;
		margin-bottom: 1rem;
		font-size: 0.875rem;
	}

	.validation-message.valid {
		color: var(--pico-ins-color);
	}

	.validation-message.error {
		color: var(--pico-del-color);
	}
</style>
