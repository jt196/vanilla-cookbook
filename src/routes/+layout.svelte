<script lang="ts">
	import '@picocss/pico'
	import type { PageData } from './$types'
	export let data: PageData
</script>

<div class="container">
	<nav>
		<ul>
			<li>
				<strong>
					<a href="/"> Blogly </a>
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
					<li>
						<button formaction="/logout" type="submit" role="button">Logout</button>
					</li>
				{/if}
			</form>
		</ul>
	</nav>
	<slot />
</div>
