<script>
	import { tick } from 'svelte'
	import { goto } from '$app/navigation'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Search from '$lib/components/svg/Search.svelte'
	import List from '$lib/components/svg/List.svelte'
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'
	import New from '$lib/components/svg/New.svelte'
	import Shopping from '$lib/components/svg/Shopping.svelte'
	import Calendar from '$lib/components/svg/Calendar.svelte'
	import Export from '$lib/components/svg/Export.svelte'
	import Settings from '$lib/components/svg/Settings.svelte'
	import Users from '$lib/components/svg/Users.svelte'
	import User from '$lib/components/svg/User.svelte'
	import Theme from '$lib/components/svg/Theme.svelte'
	import Link from '$lib/components/svg/Link.svelte'
	import { commandPaletteOpen } from '$lib/stores/commandPalette'
	import { buildCommands, filterCommands, importUrlFrom } from '$lib/utils/commandPalette'
	import { getRecentRecipes } from '$lib/utils/recentRecipes'
	import { t } from '$lib/stores/locale.js'

	/**
	 * ⌘K / Ctrl+K command palette: quick recipe search, navigation and actions.
	 * Open it from anywhere with `commandPaletteOpen.set(true)`.
	 *
	 * @type {{ user: { userId: string, isAdmin?: boolean } | null, themePreference: string, onThemeChange: (theme: string) => void }}
	 */
	let { user, themePreference, onThemeChange } = $props()

	const icons = { List, FoodBowl, New, Shopping, Calendar, Export, Settings, Users, User, Theme }

	let isOpen = $state(false)
	let query = $state('')
	let activeIndex = $state(0)
	let recipes = $state([])
	let recent = $state([])
	let input = $state()
	let list = $state()

	// Keep the store and the dialog in sync in both directions
	$effect(() => commandPaletteOpen.subscribe((open) => (isOpen = open)))
	$effect(() => {
		if (isOpen !== $commandPaletteOpen) commandPaletteOpen.set(isOpen)
	})

	$effect(() => {
		if (!isOpen) return
		query = ''
		recipes = []
		recent = getRecentRecipes(user?.userId)
		tick().then(() => input?.focus())
	})

	// Recipe name search, debounced; stale responses are dropped
	$effect(() => {
		const q = query.trim()
		if (q.length < 2 || importUrlFrom(q)) {
			recipes = []
			return
		}
		const controller = new AbortController()
		const timer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/recipe/lookup?q=${encodeURIComponent(q)}`, {
					signal: controller.signal
				})
				if (res.ok) recipes = (await res.json()).results
			} catch {
				// Aborted by a newer query, or offline: keep showing commands
			}
		}, 150)
		return () => {
			clearTimeout(timer)
			controller.abort()
		}
	})

	const label = (command) =>
		$t(command.labelKey, {
			...command.labelVars,
			...(command.labelVars?.theme && { theme: $t(command.labelVars.theme) })
		})

	const commands = $derived(filterCommands(buildCommands(user, themePreference), query, label))
	const importUrl = $derived(user ? importUrlFrom(query) : null)

	/** Everything selectable, in display order, so arrow keys can walk one list. */
	const items = $derived([
		...(importUrl ? [{ kind: 'import', url: importUrl }] : []),
		// With no query, offer recently viewed recipes first
		...(query.trim()
			? []
			: recent.map(({ uid, name, photoId, image_url }) => ({
					kind: 'recent',
					recipe: { uid, name, image_url, photos: photoId ? [{ id: photoId }] : [] }
				}))),
		...recipes.map((recipe) => ({ kind: 'recipe', recipe })),
		...commands.map((command) => ({ kind: 'command', command }))
	])

	const sections = $derived(
		[
			{ title: null, kind: 'import' },
			{ title: $t('palette.recentlyViewed'), kind: 'recent' },
			{ title: $t('palette.recipes'), kind: 'recipe' },
			{ title: $t('palette.goTo'), kind: 'command', group: 'goto' },
			{ title: $t('palette.actions'), kind: 'command', group: 'actions' }
		]
			.map((section) => ({
				...section,
				entries: items
					.map((item, index) => ({ item, index }))
					.filter(
						({ item }) =>
							item.kind === section.kind && (!section.group || item.command.group === section.group)
					)
			}))
			.filter((section) => section.entries.length)
	)

	$effect(() => {
		void query
		activeIndex = 0
	})

	function run(item) {
		if (!item) return
		isOpen = false
		if (item.kind === 'import') goto(`/recipe/new?url=${encodeURIComponent(item.url.href)}`)
		else if (item.kind === 'recipe' || item.kind === 'recent')
			goto(`/recipe/${item.recipe.uid}/view`)
		else if (item.command.theme) onThemeChange(item.command.theme)
		else goto(item.command.href)
	}

	async function move(step) {
		if (!items.length) return
		activeIndex = (activeIndex + step + items.length) % items.length
		await tick()
		list?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
	}

	function onInputKeydown(event) {
		if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
			event.preventDefault()
			move(event.key === 'ArrowDown' ? 1 : -1)
		} else if (event.key === 'Enter') {
			event.preventDefault()
			run(items[activeIndex])
		}
	}

	/** ⌘K / Ctrl+K toggles the palette anywhere; "/" opens it when not typing in a field. */
	function onWindowKeydown(event) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault()
			isOpen = !isOpen
			return
		}
		const target = /** @type {HTMLElement} */ (event.target)
		const typing = target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName)
		if (event.key === '/' && !typing && !isOpen) {
			event.preventDefault()
			isOpen = true
		}
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<Dialog bind:isOpen class="p-0 max-w-xl self-start mt-[10vh] overflow-hidden">
	<div class="flex items-center gap-3 px-4 border-b border-base-300">
		<span class="text-base-content/50"><Search width="16px" height="16px" /></span>
		<input
			bind:this={input}
			bind:value={query}
			onkeydown={onInputKeydown}
			type="text"
			class="w-full bg-transparent py-4 outline-none text-base"
			placeholder={$t('palette.placeholder')}
			aria-label={$t('palette.placeholder')}
			role="combobox"
			aria-expanded="true"
			aria-controls="command-palette-list"
			aria-activedescendant={items.length ? `palette-item-${activeIndex}` : undefined}
			autocomplete="off"
			spellcheck="false" />
		<kbd class="kbd kbd-sm">esc</kbd>
	</div>

	<div
		bind:this={list}
		id="command-palette-list"
		role="listbox"
		class="max-h-[60vh] overflow-y-auto p-2">
		{#each sections as section (section.title ?? section.kind)}
			{#if section.title}
				<div
					class="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-base-content/50">
					{section.title}
				</div>
			{/if}
			{#each section.entries as { item, index } (index)}
				{@const Icon = item.kind === 'command' ? icons[item.command.icon] : null}
				<button
					type="button"
					id="palette-item-{index}"
					role="option"
					aria-selected={index === activeIndex}
					data-active={index === activeIndex}
					class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left"
					class:bg-base-300={index === activeIndex}
					onmousemove={() => (activeIndex = index)}
					onclick={() => run(item)}>
					{#if item.kind === 'import'}
						<span class="text-primary"><Link width="18px" height="18px" /></span>
						<span class="truncate">{$t('palette.importUrl', { host: item.url.hostname })}</span>
					{:else if item.kind === 'recipe' || item.kind === 'recent'}
						<span class="h-9 w-9 shrink-0 overflow-hidden rounded bg-base-300">
							{#if item.recipe.photos[0]}
								<img
									src="/api/recipe/image/{item.recipe.photos[0].id}?w=400"
									alt=""
									class="h-full w-full object-cover" />
							{:else if item.recipe.image_url}
								<img src={item.recipe.image_url} alt="" class="h-full w-full object-cover" />
							{/if}
						</span>
						<span class="flex-1 truncate">{item.recipe.name}</span>
						{#if item.recipe.author}
							<span class="text-sm text-base-content/50 shrink-0">
								{$t('palette.byAuthor', { name: item.recipe.author })}
							</span>
						{/if}
					{:else}
						<span class="text-primary"><Icon width="18px" height="18px" /></span>
						<span class="truncate">{label(item.command)}</span>
					{/if}
				</button>
			{/each}
		{:else}
			<p class="px-3 py-6 text-center text-base-content/50">{$t('palette.noResults')}</p>
		{/each}
	</div>

	<div
		class="hidden sm:flex items-center gap-4 border-t border-base-300 px-4 py-2 text-xs text-base-content/60">
		<span
			><kbd class="kbd kbd-xs">↑</kbd> <kbd class="kbd kbd-xs">↓</kbd>
			{$t('palette.navigate')}</span>
		<span><kbd class="kbd kbd-xs">↵</kbd> {$t('palette.open')}</span>
		<span class="ml-auto"><kbd class="kbd kbd-xs">esc</kbd> {$t('palette.close')}</span>
	</div>
</Dialog>
