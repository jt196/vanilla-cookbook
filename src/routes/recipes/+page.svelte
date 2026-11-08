<script>
	import RecipeFeed from '$lib/components/recipe/RecipeFeed.svelte'
	import RecipeScopeTabs from '$lib/components/recipe/RecipeScopeTabs.svelte'
	import { t } from '$lib/stores/locale.js'

	/** @type {{data: any}} */
	let { data } = $props()

	const { recipes, viewerUserId, semanticAvailable } = $derived(data)
</script>

<RecipeFeed
	{recipes}
	viewMode="social"
	{viewerUserId}
	semanticEnabled={semanticAvailable}
	title={$t('recipe.allRecipes')}
	feedKind="all">
	{#snippet header()}
		{#if viewerUserId}
			<RecipeScopeTabs userId={viewerUserId} active="all" />
		{:else}
			<div class="mb-2 md:mb-4 prose max-w-none flex justify-center">
				<h2>{$t('recipe.allRecipes')}</h2>
			</div>
		{/if}
	{/snippet}
</RecipeFeed>
