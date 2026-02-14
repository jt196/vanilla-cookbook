<script>
	import { onMount } from 'svelte'

	/** @type {{align?: 'start' | 'end', summaryClass?: string, summaryAriaLabel?: string, contentClass?: string, trigger?: import('svelte').Snippet, children?: import('svelte').Snippet}} */
	let {
		align = 'end',
		summaryClass = 'btn btn-sm btn-outline',
		summaryAriaLabel = '',
		contentClass = 'menu dropdown-content bg-base-100 rounded-box z-[1] p-2 shadow-sm',
		trigger,
		children
	} = $props()

	let root

	onMount(() => {
		const handlePointerDown = (event) => {
			if (!root?.open) return
			if (root.contains(event.target)) return
			root.open = false
		}

		document.addEventListener('pointerdown', handlePointerDown)
		return () => document.removeEventListener('pointerdown', handlePointerDown)
	})
</script>

<details bind:this={root} class={`dropdown dropdown-${align}`}>
	<summary class={summaryClass} aria-label={summaryAriaLabel}>
		{#if trigger}
			{@render trigger()}
		{/if}
	</summary>
	<div class={contentClass}>
		{#if children}
			{@render children()}
		{/if}
	</div>
</details>
