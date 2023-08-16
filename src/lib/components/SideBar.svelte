<!-- Sidebar.svelte -->
<script>
	export let isOpen = false
	import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

	function closeSidebar() {
		isOpen = false
		dispatch('close')
	}
</script>

<div class="sidebar" class:open={isOpen}>
	<button class="close-btn" on:click={closeSidebar}>X</button>
	<slot />
</div>

<style lang="scss">
	.sidebar {
		width: 250px;
		padding-top: 50px;
		height: 100%;
		background-color: #333;
		overflow-y: auto; // Makes the sidebar scrollable
		color: white;
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
			color: white;
			font-size: 1.5rem;
			cursor: pointer;
		}
	}
</style>
