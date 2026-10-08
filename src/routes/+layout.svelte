<script>
	import { browser } from '$app/environment'
	import { navigating } from '$app/state'
	/**
	 * This script is responsible for importing styles and managing page data.
	 */

	// Import Tailwind CSS with DaisyUI
	import '../app.css'
	import SiteIcons from '$lib/components/ui/SiteIcons.svelte'
	import CookBook from '$lib/components/svg/CookBook.svelte'
	import NavLinks from '$lib/components/ui/NavLinks.svelte'
	import Spinner from '$lib/components/ui/Spinner.svelte'
	import { langStore, isRtl, t } from '$lib/stores/locale.js'
	import { normalizeThemePreference, resolveTheme } from '$lib/utils/theme.js'

	/** @type {{data: PageData, children?: import('svelte').Snippet}} */
	let { data, children } = $props()
	let user = $derived(data.user)
	let settings = $derived(data.settings)
	let dbSeed = $derived(data.dbSeed)
	let isNavigating = $derived(!!navigating.to)

	// Keep lang store in sync with server-resolved language
	$effect(() => {
		langStore.set(data.lang ?? 'eng')
	})

	// Apply RTL direction for Arabic
	$effect(() => {
		if (browser) {
			document.documentElement.setAttribute('dir', $isRtl ? 'rtl' : 'ltr')
		}
	})

	const siteName = import.meta.env.VITE_SITE_NAME || 'Vanilla Cookbook'
	// Theme preference: 'light', 'dracula' (dark) or 'auto' (follow the OS setting).
	// Logged-in users keep theirs on the account; visitors keep it in localStorage.
	function getInitialPreference() {
		if (!browser) return 'auto'
		if (user) return normalizeThemePreference(user.theme)
		try {
			return normalizeThemePreference(localStorage.getItem('theme'))
		} catch {
			return 'auto'
		}
	}

	const colorSchemeQuery = browser ? window.matchMedia?.('(prefers-color-scheme: dark)') : null
	let themePreference = $state(getInitialPreference())
	let systemPrefersDark = $state(!!colorSchemeQuery?.matches)
	let theme = $derived(resolveTheme(themePreference, systemPrefersDark))

	// Follow OS light/dark changes live while in auto mode
	$effect(() => {
		if (!colorSchemeQuery) return
		const update = (event) => (systemPrefersDark = event.matches)
		colorSchemeQuery.addEventListener('change', update)
		return () => colorSchemeQuery.removeEventListener('change', update)
	})

	// Apply theme
	$effect(() => {
		if (browser) {
			document.documentElement.setAttribute('data-theme', theme)
		}
	})

	/** @param {'light' | 'dracula' | 'auto'} preference */
	function setThemePreference(preference) {
		themePreference = preference
		try {
			localStorage.setItem('theme', preference)
		} catch {
			// Storage can be unavailable (private mode); the choice still applies for this visit
		}

		if (user) {
			user.theme = preference
			fetch(`/api/user/${user.userId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ theme: preference })
			})
		}
	}

	if (browser && 'serviceWorker' in navigator && !import.meta.env.DEV) {
		navigator.serviceWorker
			.register('/service-worker.js', { scope: '/' })
			.then(function (registration) {
				console.log('Service worker registered with scope:', registration.scope)
			})
			.catch(function (error) {
				console.log('Service worker registration failed:', error)
			})
	}
</script>

<svelte:head>
	<title>{siteName}</title>
</svelte:head>

<SiteIcons />

<div class="bg-base-100 border-b border-base-300">
	<div class="navbar container mx-auto px-4">
		<div class="navbar-start">
			{#if user}
				<a href="/" class="flex items-center gap-2 text-primary">
					<CookBook width="45px" height="45px" />
					<img src="/icons/site-logo.svg" alt="Vanilla Cookbook" class="h-12" />
				</a>
			{:else}
				<div class="flex items-center gap-2 text-primary">
					<CookBook width="45px" height="45px" />
					<img src="/icons/site-logo.svg" alt="Vanilla Cookbook" class="h-12" />
				</div>
			{/if}
		</div>

		{#if dbSeed}
			<div class="navbar-end">
				<!-- Desktop Navigation - hidden on mobile -->
				<div class="hidden lg:flex">
					<NavLinks {user} {settings} {themePreference} onThemeChange={setThemePreference} />
				</div>

				<!-- Mobile Hamburger Menu -->
				<div class="dropdown dropdown-end lg:hidden">
					<div
						tabindex="0"
						role="button"
						class="btn btn-ghost btn-circle"
						aria-label={$t('nav.menu')}>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M4 6h16M4 12h16M4 18h16" />
						</svg>
					</div>
					<ul
						class="dropdown-content menu bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow-lg border border-base-300">
						<NavLinks
							{user}
							{settings}
							{themePreference}
							onThemeChange={setThemePreference}
							mobile={true} />
					</ul>
				</div>
			</div>
		{/if}
	</div>
</div>

<Spinner visible={isNavigating} spinnerContent={$t('common.loading')} />

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto px-4 py-6">
		{@render children?.()}
	</div>
</div>
