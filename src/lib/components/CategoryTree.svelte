<script>
	import CategoryTree from '$lib/components/CategoryTree.svelte'
	import Button from '$lib/components/ui/Button.svelte'

	/** @type {{categories?: any, onCategoryClick?: any, selectedCategoryUids?: any}} */
	let { categories = [], onCategoryClick = () => {}, selectedCategoryUids = [] } = $props();
</script>

<ul>
	{#each categories as category (category.uid)}
		<!-- Keep the key for each loop -->
		<li class="categories">
			<Button
				onclick={() => onCategoryClick(category)}
				class={selectedCategoryUids.includes(category.uid) ? 'selected' : ''}>
				{category.name ? category.name : 'Unnamed Cat'}
			</Button>
			{#if category.children && category.children.length}
				<CategoryTree categories={category.children} {onCategoryClick} {selectedCategoryUids} />
			{/if}
		</li>
	{/each}
</ul>

<style lang="scss">
	.categories :global(button) {
		background: none;
		border: none;
		padding: 0.1rem;
		font: inherit;
		cursor: pointer;
		outline: inherit;
		&:focus {
			outline: none;
			box-shadow: 0 0 5px var(--pico-primary); // A blue shadow for example
		}
		&:hover {
			background: var(--pico-primary-focus);
			transition: background 0.2s;
		}
	}

	li {
		margin: 5px 0;
	}

	.categories :global(button.selected) {
		background: var(--pico-primary);
	}
</style>
