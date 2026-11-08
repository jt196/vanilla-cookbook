<script>
	import { browser } from '$app/environment'
	import Search from '$lib/components/svg/Search.svelte'
	import { commandPaletteOpen } from '$lib/stores/commandPalette'
	import { t } from '$lib/stores/locale.js'

	/** Navbar button that opens the command palette: an input-like box, icon only on small screens. */
	const isMac = browser && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
	const shortcut = isMac ? '⌘K' : 'Ctrl K'
</script>

<button
	type="button"
	onclick={() => commandPaletteOpen.set(true)}
	aria-label={$t('nav.search')}
	aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
	class="btn btn-ghost btn-circle md:btn-sm md:w-48 md:justify-start md:rounded-lg md:border md:border-base-300 md:bg-base-200 md:font-normal md:text-base-content/60">
	<span class="text-primary md:text-current"><Search width="18px" height="18px" /></span>
	<span class="hidden md:inline flex-1 text-left">{$t('nav.search')}</span>
	<kbd class="kbd kbd-sm hidden md:inline-flex">{shortcut}</kbd>
</button>
