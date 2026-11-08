<script>
	import RecipeFeed from '$lib/components/recipe/RecipeFeed.svelte'
	import { t } from '$lib/stores/locale.js'
	import RecipeScopeTabs from '$lib/components/recipe/RecipeScopeTabs.svelte'

	/** @type {{data: any}} */
	let { data } = $props()

	const { recipes, user, semanticAvailable } = $derived(data)
	const { viewingUserId, requestedUserId, publicProfile } = $derived(user)

	const viewMode = $derived(viewingUserId === requestedUserId ? 'owner' : 'social')
</script>

<RecipeFeed
	{recipes}
	{viewMode}
	viewerUserId={viewingUserId}
	ownerUserId={requestedUserId}
	ownerUsername={publicProfile.username}
	semanticEnabled={semanticAvailable}
	feedKind="user">
	{#snippet header()}
		{#if viewMode === 'owner'}
			<RecipeScopeTabs userId={viewingUserId} active="mine" />
		{:else}
			<div class="mb-2 md:mb-4 prose max-w-none flex justify-center">
				<h2>{$t('nav.cookbook', { username: publicProfile.username })}</h2>
			</div>
		{/if}
	{/snippet}
</RecipeFeed>
