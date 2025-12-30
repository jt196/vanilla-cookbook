<!-- Sidebar.svelte -->
<script>
	import IconButton from '$lib/components/ui/IconButton.svelte'

	/** @type {{isOpen?: boolean, onClose?: () => void, children?: import('svelte').Snippet}} */
	let { isOpen = false, onClose, children } = $props()

	function closeSidebar() {
		onClose?.()
	}
</script>

<div
	class="fixed top-0 left-0 h-full w-64 bg-base-300 overflow-y-auto z-[1000] pt-12 transition-transform duration-300 ease-in-out md:w-64 max-md:w-full max-md:h-1/2 max-md:top-auto max-md:bottom-0"
	class:-translate-x-full={!isOpen}
	class:max-md:translate-y-full={!isOpen}
	class:translate-x-0={isOpen}
	class:max-md:translate-y-0={isOpen}>
	<button
		onclick={closeSidebar}
		class="btn btn-sm btn-circle btn-ghost absolute top-2 right-2"
		aria-label="Close sidebar">
		X
	</button>
	{@render children?.()}
</div>
