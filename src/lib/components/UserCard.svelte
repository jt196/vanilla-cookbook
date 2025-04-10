<!-- RecipeCard.svelte -->
<script>
	/** @type {{item: any}} */
	let { item } = $props()
</script>

<a href="/user/{item.id}/recipes/" class="user-card">
	<article>
		<h3>
			{item.username}
		</h3>
		<span>
			Public Recipes: <i>{item._count.recipes}</i>
		</span>
	</article>
</a>

<style lang="scss">
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

	a.user-card {
		color: var(--color);
	}
</style>
