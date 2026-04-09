<script>
	import { t } from '$lib/stores/locale.js'

	let {
		/**
		 * @type {string | null}
		 */
		message = null,
		/**
		 * @type {string | null}
		 */
		messageCode = null,
		/**
		 * @type {Record<string, string|number>}
		 */
		messageVars = {},
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

	const resolvedMessage = $derived(messageCode ? $t(messageCode, messageVars) : message)
	const typeClass = $derived(isValid ? 'text-success' : isError ? 'text-error' : 'text-info')
	const shouldHide = $derived(hidden || !resolvedMessage)
</script>

{#if resolvedMessage}
	<div
		class="validator-hint {typeClass}"
		class:hidden={shouldHide}
		style:visibility={shouldHide ? 'hidden' : 'visible'}
		role="alert"
	>
		{resolvedMessage}
	</div>
{/if}
