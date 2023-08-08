<script>
	/**
	 * This script is responsible for importing styles and managing page data.
	 */

	// Imports styles from PicoCSS.
	import '@picocss/pico'

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
					<a href="/"> Bigly Recipes </a>
				</strong>
			</li>
		</ul>
		<ul>
			<form method="POST">
				<li><a href="/">Home</a></li>
				<li><a href="/recipe">Recipes</a></li>
				{#if !data.user}
					<li><a href="/register">Register</a></li>
					<li><a href="/login" role="button">Login</a></li>
				{:else}
					<li>
						<button formaction="/logout" type="submit">Logout</button>
					</li>
				{/if}
			</form>
		</ul>
	</nav>
	<slot />
</div>
