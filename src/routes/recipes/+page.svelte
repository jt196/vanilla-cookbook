<script>
	import RecipeFeed from '$lib/components/recipe/RecipeFeed.svelte'

	/** @type {{data: any}} */
	let { data } = $props()

	const { recipes, viewerUserId, semanticAvailable } = data
</script>

<RecipeFeed
	{recipes}
	viewMode="social"
	{viewerUserId}
	semanticEnabled={semanticAvailable}
	title="All Recipes"
	useCats={false}
	feedKind="all"
/>
