<script>
	import RecipeFeed from '$lib/components/recipe/RecipeFeed.svelte'

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
	feedKind="user" />
