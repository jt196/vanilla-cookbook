<script>
	import Settings from '$lib/components/svg/Settings.svelte'
	/**
	 * This script is responsible for importing styles and managing page data.
	 */

	// Imports styles from PicoCSS.
	import '@picocss/pico'

	// Import Global CSS
	import '$lib/css/global.scss'
	/**
	 * Data for the page, structure defined by the `PageData` type.
	 * @type {PageData}
	 */
	export let data
	const { user, settings } = data
</script>

<div class="container">
	<nav>
		<ul>
			<li>
				<strong>
					{#if user}
						<a href="/user/{user.userId}/recipes"> Cookrr </a>
					{:else}
						<a href="/"> Cookrr </a>
					{/if}
				</strong>
			</li>
		</ul>
		<ul>
			<form method="POST">
				{#if !user}
					<li><a href="/login" role="button">Login</a></li>
					{#if settings.registrationAllowed}
						<li><a href="/register">Register</a></li>
					{/if}
				{:else}
					<li><a href="/user/options/settings"><Settings width="25px" /></a></li>
				{/if}
			</form>
		</ul>
	</nav>
	<slot />
</div>
