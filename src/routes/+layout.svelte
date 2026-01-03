<script>
	import { browser } from '$app/environment'
	/**
	 * This script is responsible for importing styles and managing page data.
	 */

	// Import Tailwind CSS with DaisyUI
	import '../app.css'
	import SiteIcons from '$lib/components/SiteIcons.svelte'
	import CookBook from '$lib/components/svg/CookBook.svelte'
	import NavLinks from '$lib/components/NavLinks.svelte'

	/** @type {{data: PageData, children?: import('svelte').Snippet}} */
	let { data, children } = $props()
	let user = $derived(data.user)
	let settings = $derived(data.settings)
	let dbSeed = $derived(data.dbSeed)

	const siteName = import.meta.env.VITE_SITE_NAME || 'Vanilla Cookbook'
	const LIGHT_THEME = 'light'
	const DARK_THEME = 'dracula'
	const LEGACY_DARK = 'dark'

	function normalizeTheme(value) {
		if (value === LIGHT_THEME) return LIGHT_THEME
		if (value === DARK_THEME || value === LEGACY_DARK) return DARK_THEME
		return LIGHT_THEME
	}

	// Get initial theme value
	function getInitialTheme() {
		if (!browser) return 'dark'

		const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches

		// 1. If no user, use browser preference
		if (!user) {
			return prefersDark ? DARK_THEME : LIGHT_THEME
		}
		// 2. If user is logged in, use their saved theme or fall back to browser
		return normalizeTheme(user.theme ?? (prefersDark ? DARK_THEME : LIGHT_THEME))
	}

	let theme = $state(getInitialTheme())

	// Apply theme
	$effect(() => {
		if (browser) {
			document.documentElement.setAttribute('data-theme', theme)
		}
	})

	// Toggle theme and save to user
	function toggleTheme() {
		theme = theme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME
		document.documentElement.setAttribute('data-theme', theme)
		localStorage.setItem('theme', theme)

		if (user) {
			user.theme = theme
			fetch(`/api/user/${user.userId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(user)
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

<div class="navbar bg-base-100 border-b border-base-300">
	<div class="navbar-start">
		{#if user}
			<a href={`/user/${user.userId}/recipes`} class="flex items-center gap-2 text-primary">
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
				<NavLinks {user} {settings} {theme} onToggleTheme={toggleTheme} />
			</div>

			<!-- Mobile Hamburger Menu -->
			<div class="dropdown dropdown-end lg:hidden">
				<div tabindex="0" role="button" class="btn btn-ghost btn-circle" aria-label="Menu">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</div>
				<ul class="dropdown-content menu bg-base-100 rounded-box z-50 mt-3 w-52 p-2 shadow-lg border border-base-300">
					<NavLinks {user} {settings} {theme} onToggleTheme={toggleTheme} mobile={true} />
				</ul>
			</div>
		</div>
	{/if}
</div>

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto px-4 py-6">
		{@render children?.()}
	</div>
</div>
