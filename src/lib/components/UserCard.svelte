<!-- RecipeCard.svelte -->
<script>
	import User from '$lib/components/svg/User.svelte'

	/** @type {{item: any}} */
	let { item } = $props();
</script>

<article>
	<div class="grid">
		<User width="75px" />
		<a href="/user/{item.id}/recipes/" class="user-card">
			<div>
				<header>{item.name}</header>
				<span class="about">
					<p>About: <i>{item.about}</i></p>
				</span>
			</div>
		</a>
	</div>
</article>

<style lang="scss">
	.grid {
		display: grid;
		grid-template-columns: 100px 3fr 1fr; // 100px for the image, 3 parts for the recipe card, and 1 part for the buttons
		gap: 1rem; // Spacing between grid items
		align-items: center;
	}

	.user-card {
		grid-column: 2;
		text-decoration: none;
		color: inherit;
	}

	article {
		transition: background-color 0.2s ease;
		padding: 1rem;
		margin-bottom: 1rem;
		@media (max-width: 767px) {
			padding: 0.5rem;
			margin-bottom: 0.5rem;
		}
	}

	article:hover {
		background-color: var(--pico-secondary-focus);
	}
</style>
