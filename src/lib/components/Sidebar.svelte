<!-- Sidebar.svelte -->
<script>
	import { createEventDispatcher } from 'svelte'
	/** @type {{isOpen?: boolean, onClose?: () => void, children?: import('svelte').Snippet}} */
	let { isOpen = false, onClose, children } = $props()

	function closeSidebar() {
		onClose?.() // Call the parent function instead of modifying `isOpen`
	}
</script>

<div class="sidebar" class:open={isOpen}>
	<button class="close-btn" onclick={closeSidebar}>X</button>
	{@render children?.()}
</div>

<style lang="scss">
	.sidebar {
		width: 250px;
		padding-top: 50px;
		height: 100%;
		background-color: var(--pico-color);
		overflow-y: auto; // Makes the sidebar scrollable
		color: var(--pico-background-color);
		position: fixed;
		top: 0;
		left: 0;
		transform: translateX(-100%);
		transition: transform 0.3s ease;
		z-index: 1000; // Ensure it's above other content

		&.open {
			transform: translateX(0);
		}

		@media (max-width: 767px) {
			width: 100%;
			height: 50vh; // Adjust this based on your preference
			bottom: 0;
			top: auto; // Reset the top positioning
			left: 0; // Ensure it's horizontally aligned
			transform: translateY(100%) translateX(0); // Reset the translateX and apply translateY

			&.open {
				transform: translateY(0) translateX(0); // Reset both transforms when open
			}
		}

		.close-btn {
			position: absolute;
			top: 10px;
			padding: 0;
			margin: 0;
			right: 10px;
			background: none;
			border: none;
			color: var(--pico-background-color);
			font-size: 1.5rem;
			cursor: pointer;
		}
	}
</style>
