<script>
	import RecipeFeed from '$lib/components/recipe/RecipeFeed.svelte'

	/** @type {{data: any}} */
	let { data } = $props()

	const { recipes, viewerUserId } = data
</script>

<RecipeFeed
	{recipes}
	viewMode="social"
	viewerUserId={viewerUserId}
	title="All Recipes"
	useCats={false} />
