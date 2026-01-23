<script>
	import Images from '$lib/components/svg/Images.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import Edit from '$lib/components/svg/Edit.svelte'
	import { goto } from '$app/navigation'
	import {
		addRecipeLog,
		changeRecipeFavourite,
		changeRecipePublic,
		deleteRecipeById
	} from '$lib/utils/crud'
	import Favourite from './svg/Favourite.svelte'
	import Check from './svg/Check.svelte'
	import RecipeShareButton from './RecipeShareButton.svelte'
	import Public from './svg/Public.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte'

	/** @type {{recipe: any, updateLogs: any, favRecipe: any}} */
	let { recipe, updateLogs, favRecipe, pubRecipe, logs, viewOnly } = $props()
	let showDeleteConfirm = $state(false)
	let pendingDeleteUid = $state(null)
	let loadingFav = $state(false)
	let loadingPub = $state(false)
	let loadingLog = $state(false)

	async function handleDelete(uid) {
		pendingDeleteUid = uid
		showDeleteConfirm = true
	}

	async function handleFavourite(uid) {
		loadingFav = true
		const success = await changeRecipeFavourite(uid)
		loadingFav = false
		if (success) {
			favRecipe(success)
		}
	}

	async function handlePublic(uid) {
		loadingPub = true
		const success = await changeRecipePublic(uid)
		loadingPub = false
		if (success) {
			pubRecipe(success)
		}
	}

	async function handleLog(uid) {
		loadingLog = true
		let response = await addRecipeLog(uid)
		loadingLog = false
		if (response.success) {
			const newLog = response.data
			updateLogs(newLog.recipeLog, response)
		} else {
			console.log('Failed to log recipe!')
		}
	}
</script>

{#if !viewOnly || recipe.is_public}
	<RecipeShareButton name={recipe.name} isPublic={recipe.is_public} uid={recipe.uid} {pubRecipe} />
{:else}
	<button class="btn btn-outline btn-sm tooltip" data-tip="Private Recipe">
		<Public isPublic={recipe.is_public} width="20px" height="20px" fill="currentColor" />
	</button>
{/if}
{#if !viewOnly}
	<a
		href="/recipe/{recipe?.uid}/edit/"
		class="btn btn-soft btn-primary btn-sm tooltip"
		data-tip="Edit Recipe"
		data-testid="edit-button">
		<Edit width="20px" height="20px" fill="currentColor" />
	</a>
	<a
		href="/recipe/{recipe?.uid}/images/"
		class="btn btn-soft btn-primary btn-sm tooltip"
		data-tip="Edit Recipe Images"
		data-testid="edit-button">
		<Images width="20px" height="20px" fill="currentColor" />
	</a>
	<button
		onclick={(event) => handlePublic(recipe?.uid)}
		class="btn btn-soft btn-primary btn-sm tooltip"
		class:btn-success={recipe?.is_public}
		disabled={loadingPub}
		data-tip={recipe?.is_public ? 'Private Recipe?' : 'Public Recipe?'}>
		{#if loadingPub}
			<span class="loading loading-spinner loading-sm"></span>
		{:else}
			<Public isPublic={recipe?.is_public} width="20px" height="20px" fill="currentColor" />
		{/if}
	</button>
	<button
		onclick={(event) => handleFavourite(recipe?.uid)}
		class="btn btn-soft btn-primary btn-sm tooltip"
		class:text-error={recipe?.on_favorites}
		disabled={loadingFav}
		data-tip={recipe?.on_favorites ? 'Unfavourite Recipe' : 'Favourite Recipe'}>
		{#if loadingFav}
			<span class="loading loading-spinner loading-sm"></span>
		{:else}
			<Favourite favourite={recipe?.on_favorites} width="20px" height="20px" fill="currentColor" />
		{/if}
	</button>
	<button
		onclick={() => handleLog(recipe?.uid)}
		class="btn btn-soft btn-primary btn-sm tooltip"
		class:text-success={logs?.length > 0}
		disabled={loadingLog}
		data-tip="Mark Recipe Cooked Today"
		data-testid="check-button">
		{#if loadingLog}
			<span class="loading loading-spinner loading-sm"></span>
		{:else}
			<Check width="20px" height="20px" checked={logs?.length > 0} fill="currentColor" />
		{/if}
	</button>
	<button
		onclick={() => handleDelete(recipe?.uid)}
		data-testid="delete-button"
		class="btn btn-soft btn-primary btn-sm tooltip"
		data-tip="Delete Recipe">
		<Delete width="20px" height="20px" fill="currentColor" />
	</button>
{/if}

<ConfirmationDialog
	bind:isOpen={showDeleteConfirm}
	onClose={() => (showDeleteConfirm = false)}
	onConfirm={async () => {
		if (!pendingDeleteUid) return
		const success = await deleteRecipeById(pendingDeleteUid)
		showDeleteConfirm = false
		if (success) {
			goto('/')
		}
	}}>
	{#snippet content()}
		<h3 class="font-bold text-lg">Delete Recipe</h3>
		<p class="py-4">Are you sure you want to delete this recipe?</p>
	{/snippet}
</ConfirmationDialog>
