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
</script>

<div class="container">
	<nav>
		<ul>
			<li>
				<strong>
					<a href="/"> Chefbook </a>
				</strong>
			</li>
		</ul>
		<ul>
			<form method="POST">
				<li><a href="/">Home</a></li>
				{#if !data.user}
					<li><a href="/register">Register</a></li>
					<li><a href="/login" role="button">Login</a></li>
				{:else}
					<li><a href="/user/settings"><Settings width="25px" /></a></li>
					<li>
						<button formaction="/logout" type="submit">Logout</button>
					</li>
				{/if}
			</form>
		</ul>
	</nav>
	<slot />
</div>
