<!-- ConfirmationDialog.svelte -->
<script>
	import { onMount, onDestroy } from 'svelte'
	import { browser } from '$app/environment'

	/** @type {{isOpen?: boolean, content?: import('svelte').Snippet}} */
	let { isOpen = false, content, onClose, onConfirm } = $props()

	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen) {
			onClose && onClose()
		}
	}

	onMount(() => {
		if (browser) {
			document.addEventListener('keydown', handleKeydown)
		}
	})

	onDestroy(() => {
		if (browser) {
			document.removeEventListener('keydown', handleKeydown)
		}
	})
</script>

{#if isOpen}
	<dialog open>
		<article>
			{#if content}{@render content()}{:else}
				<!-- Default content if no slot is provided -->
				<h2>Confirm Action</h2>
				<p>Are you sure you want to proceed?</p>
			{/if}
			<footer>
				<button class="secondary" onclick={() => onClose && onClose()}>Cancel</button>
				<button onclick={() => onConfirm && onConfirm()}>Confirm</button>
			</footer>
		</article>
	</dialog>
{/if}
