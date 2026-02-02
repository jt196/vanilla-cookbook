<script>
	/**
	 * DaisyUI Modal/Dialog Component
	 * Uses native HTML dialog element with DaisyUI styling
	 */

	let {
		/**
		 * Controls whether modal is open
		 * @type {boolean}
		 */
		isOpen = $bindable(),
		/**
		 * Modal content
		 * @type {import('svelte').Snippet}
		 */
		children,
		/**
		 * Callback when modal closes
		 * @type {() => void}
		 */
		onClose = undefined,
		/**
		 * Allow closing on ESC key (default: true)
		 * @type {boolean}
		 */
		closeOnEscape = true,
		/**
		 * Allow closing by clicking backdrop (default: true)
		 * @type {boolean}
		 */
		closeOnBackdrop = true,
		/**
		 * Additional classes for modal-box
		 * @type {string}
		 */
		class: className = ''
	} = $props()

	let dialogElement = $state()

	// Watch isOpen and call showModal/close accordingly
	$effect(() => {
		if (!dialogElement) return

		if (isOpen) {
			dialogElement.showModal()
		} else {
			dialogElement.close()
		}
	})

	// Handle dialog close event
	function handleDialogClose() {
		isOpen = false
		onClose?.()
	}

	// Handle backdrop click
	function handleBackdropClick() {
		if (closeOnBackdrop) {
			isOpen = false
			onClose?.()
		}
	}
</script>

<dialog
	bind:this={dialogElement}
	class="modal"
	onclose={handleDialogClose}
	oncancel={(e) => {
		if (!closeOnEscape) {
			e.preventDefault()
		}
	}}>
	<div class="modal-box {className}">
		{@render children()}
	</div>
	{#if closeOnBackdrop}
		<!-- Using div instead of form to avoid nested form issues -->
		<div class="modal-backdrop" role="button" tabindex="-1" onclick={handleBackdropClick} onkeydown={(e) => e.key === 'Enter' && handleBackdropClick()}>
			<span class="sr-only">close</span>
		</div>
	{/if}
</dialog>
