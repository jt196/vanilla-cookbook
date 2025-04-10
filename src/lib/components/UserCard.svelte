<!-- RecipeCard.svelte -->
<script>
	/** @type {{item: any}} */
	let { item } = $props()

	let recipeCount = $derived(item._count.recipes)
</script>

{#if recipeCount > 0}
	<a href="/user/{item.id}/recipes/" class="user-card">
		<article>
			<h3>{item.username}</h3>
			<span>
				Public Recipes: <i>{recipeCount}</i>
			</span>
		</article>
	</a>
{/if}

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

	a:hover {
		background-color: var(--pico-secondary-focus);
	}

	a.user-card {
		color: var(--color);
	}
</style>
