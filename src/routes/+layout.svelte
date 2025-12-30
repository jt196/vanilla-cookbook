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

	// Get initial theme value
	function getInitialTheme() {
		if (!browser) return 'dark'

		const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches

		// 1. If no user, use browser preference
		if (!user) {
			return prefersDark ? 'dark' : 'light'
		}
		// 2. If user is logged in, use their saved theme or fall back to browser
		return user.theme ?? (prefersDark ? 'dark' : 'light')
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
		theme = theme === 'dark' ? 'light' : 'dark'
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
			<a href={`/user/${user.userId}/recipes`} class="flex items-center gap-2 text-base-content">
				<CookBook width="45px" height="45px" />
				<img
					src="/icons/site-logo.svg"
					alt="Vanilla Cookbook"
					class="h-12"
				/>
			</a>
		{:else}
			<div class="flex items-center gap-2 text-base-content">
				<CookBook width="45px" height="45px" />
				<img
					src="/icons/site-logo.svg"
					alt="Vanilla Cookbook"
					class="h-12"
				/>
			</div>
		{/if}
	</div>

	{#if dbSeed}
		<div class="navbar-end">
			<NavLinks {user} {settings} {theme} onToggleTheme={toggleTheme} />
		</div>
	{/if}
</div>

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto px-4 py-6">
		{@render children?.()}
	</div>
</div>
