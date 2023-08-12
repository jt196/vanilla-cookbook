<script>
	import CategoryTree from '$lib/components/CategoryTree.svelte'

	export let categories = []
</script>

<ul>
	{#each categories as category}
		<li>
			{category.name ? category.name : 'Unnamed Cat'}
			{#if category.children && category.children.length}
				<CategoryTree categories={category.children} />
			{/if}
		</li>
	{/each}
</ul>

<style>
	ul {
		list-style-type: none;
		padding-left: 20px;
	}

	li {
		margin: 5px 0;
	}
</style>
