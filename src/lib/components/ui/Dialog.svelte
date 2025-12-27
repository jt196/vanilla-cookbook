<script>
	import { onMount, onDestroy } from 'svelte'
	import { browser } from '$app/environment'

	let {
		/**
		 * @type {boolean}
		 */
		isOpen = $bindable(false),
		/**
		 * @type {import('svelte').Snippet}
		 */
		children,
		/**
		 * @type {() => void}
		 */
		onClose = undefined,
		/**
		 * @type {boolean}
		 */
		closeOnEscape = true
	} = $props()

	let dialogElement = $state()

	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen && closeOnEscape) {
			isOpen = false
			onClose && onClose()
		}
	}

	onMount(() => {
		if (browser && dialogElement) {
			dialogElement.addEventListener('close', () => {
				isOpen = false
				onClose && onClose()
			})
			if (closeOnEscape) {
				document.addEventListener('keydown', handleKeydown)
			}
		}
	})

	onDestroy(() => {
		if (browser && closeOnEscape) {
			document.removeEventListener('keydown', handleKeydown)
		}
	})
</script>

<dialog bind:this={dialogElement} open={isOpen}>
	<article>
		{@render children()}
	</article>
</dialog>
