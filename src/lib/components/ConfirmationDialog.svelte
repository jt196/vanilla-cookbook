<!-- ConfirmationDialog.svelte -->
<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte'
	import { browser } from '$app/environment'

	const dispatch = createEventDispatcher()
	export let isOpen = false

	function closeDialog() {
		isOpen = false
		dispatch('close') // Emit a close event
	}

	function handleKeydown(event) {
		if (event.key === 'Escape' && isOpen) {
			closeDialog()
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

	// External method to control the dialog visibility
	export function toggle(open) {
		isOpen = open
	}
</script>

{#if isOpen}
	<dialog open>
		<article>
			<slot name="content">
				<!-- Default content if no slot is provided -->
				<h2>Confirm Action</h2>
				<p>Are you sure you want to proceed?</p>
			</slot>
			<footer>
				<button class="secondary" on:click={closeDialog}>Cancel</button>
				<button on:click={() => dispatch('confirm')}>Confirm</button>
			</footer>
		</article>
	</dialog>
{/if}
