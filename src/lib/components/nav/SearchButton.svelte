<script>
	import { browser } from '$app/environment'
	import Search from '$lib/components/svg/Search.svelte'
	import { commandPaletteOpen } from '$lib/stores/commandPalette'
	import { t } from '$lib/stores/locale.js'

	/**
	 * Opens the command palette. `compact` renders a small input-like button for the navbar
	 * (icon only on small screens); otherwise a full-width search bar.
	 *
	 * @type {{ label?: string, compact?: boolean }}
	 */
	let { label = '', compact = false } = $props()

	const isMac = browser && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
	const shortcut = isMac ? '⌘K' : 'Ctrl K'
	const text = $derived(label || $t('palette.placeholder'))
</script>

<button
	type="button"
	onclick={() => commandPaletteOpen.set(true)}
	aria-label={text}
	aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
	class={compact
		? 'btn btn-ghost btn-circle md:btn-sm md:w-48 md:justify-start md:rounded-lg md:border md:border-base-300 md:bg-base-200 md:font-normal md:text-base-content/60'
		: 'flex w-full items-center gap-3 rounded-xl border border-base-300 bg-base-100 px-4 py-3 text-left text-base-content/60 shadow-sm transition hover:border-primary/50'}>
	<span class={compact ? 'text-primary md:text-current' : ''}>
		<Search width={compact ? '18px' : '16px'} height={compact ? '18px' : '16px'} />
	</span>
	<span class={compact ? 'hidden md:inline flex-1 text-left' : 'flex-1'}>{text}</span>
	<kbd class="kbd kbd-sm {compact ? 'hidden md:inline-flex' : 'hidden sm:inline-flex'}"
		>{shortcut}</kbd>
</button>
