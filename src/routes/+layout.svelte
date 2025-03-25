<script>
	import Settings from '$lib/components/svg/Settings.svelte'
	import { browser } from '$app/environment'
	/**
	 * This script is responsible for importing styles and managing page data.
	 */

	// Imports styles from PicoCSS.
	import '@picocss/pico'

	// Import Global CSS
	import '$lib/css/global.scss'
	import Users from '$lib/components/svg/Users.svelte'
	import SiteIcons from '$lib/components/SiteIcons.svelte'
	import Shopping from '$lib/components/svg/Shopping.svelte'
	import Calendar from '$lib/components/svg/Calendar.svelte'
	import New from '$lib/components/svg/New.svelte'

	/** @type {{data: PageData, children?: import('svelte').Snippet}} */
	let { data, children } = $props()
	const { user, settings } = data

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

<SiteIcons />

<div class="container">
	<nav>
		<ul>
			<li>
				<strong>
					{#if user}
						<a href={`/user/${user.userId}/recipes`}>
							<img
								id="vanilla-logo"
								src="/icons/site-logo.svg"
								alt="Vanilla"
								width="120"
								height="120" />
						</a>
					{:else}
						<img
							id="vanilla-logo"
							src="/icons/site-logo.svg"
							alt="Vanilla"
							width="120"
							height="120" />
					{/if}
				</strong>
			</li>
		</ul>
		<ul>
			<form method="POST">
				<li><a href="/new"><New width="25px" /></a></li>
				<li><a href="/user/shopping"><Shopping width="25px" /></a></li>
				<li><a href="/user/calendar"><Calendar width="25px" /></a></li>
				<li><a href="/users"><Users width="25px" /></a></li>
				{#if !user}
					<a href="/login" role="button">Login</a>
					{#if settings.registrationAllowed}
						<li><a href="/register">Register</a></li>
					{/if}
				{:else}
					<li><a href="/user/options/settings"><Settings width="25px" /></a></li>
				{/if}
			</form>
		</ul>
	</nav>
	{@render children?.()}
</div>

<style lang="scss">
	a {
		padding: 0.5rem;
	}

	#vanilla-logo {
		max-width: 60px;
		padding: none;
	}
</style>
