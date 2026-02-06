<script>
	import RecipeFeed from '$lib/components/recipe/RecipeFeed.svelte'

	/** @type {{data: any}} */
	let { data } = $props()

	const { recipes, categories, user } = data
	const { viewingUserId, requestedUserId, publicProfile } = user

	const viewMode = viewingUserId === requestedUserId ? 'owner' : 'social'
	const useCats = viewMode === 'owner' && publicProfile.useCats
</script>

<RecipeFeed
	{recipes}
	{categories}
	{viewMode}
	viewerUserId={viewingUserId}
	ownerUserId={requestedUserId}
	ownerUsername={publicProfile.username}
	{useCats}
	feedKind="user"
/>
