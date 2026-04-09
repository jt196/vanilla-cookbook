<script>
	import RecipeFeed from '$lib/components/recipe/RecipeFeed.svelte'
	import { t } from '$lib/stores/locale.js'

	/** @type {{data: any}} */
	let { data } = $props()

	const { recipes, viewerUserId, semanticAvailable } = data
</script>

<RecipeFeed
	{recipes}
	viewMode="social"
	{viewerUserId}
	semanticEnabled={semanticAvailable}
	title={$t('recipe.allRecipes')}
	feedKind="all"
/>
