<script>
	import Images from '$lib/components/svg/Images.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import Edit from '$lib/components/svg/Edit.svelte'
import { goto, invalidateAll } from '$app/navigation'
	import {
		addRecipeLog,
		changeRecipeFavourite,
		changeRecipePublic,
		deleteRecipeById,
		duplicateRecipe
	} from '$lib/utils/crud'
	import Favourite from '$lib/components/svg/Favourite.svelte'
	import Check from '$lib/components/svg/Check.svelte'
	import RecipeShareButton from '$lib/components/recipe/RecipeShareButton.svelte'
	import Public from '$lib/components/svg/Public.svelte'
	import ConfirmationDialog from '$lib/components/ui/ConfirmationDialog.svelte'
	import CookedLogModal from '$lib/components/recipe/CookedLogModal.svelte'
	import CookedHistoryModal from '$lib/components/recipe/CookedHistoryModal.svelte'
	import Calendar from '$lib/components/svg/Calendar.svelte'
import Fork from '$lib/components/svg/Fork.svelte'
import Spinner from '$lib/components/ui/Spinner.svelte'

	/** @type {{recipe: any, updateLogs: any, favRecipe: any, scale?: number, onRestoreScale?: (scale: number) => void, viewerUserId?: string | null}} */
	let {
		recipe,
		updateLogs,
		favRecipe,
		pubRecipe,
		logs,
		viewOnly,
		scale = 1,
		onRestoreScale = null,
		viewerUserId = null
	} = $props()
	let showDeleteConfirm = $state(false)
	let pendingDeleteUid = $state(null)
	let loadingFav = $state(false)
	let loadingPub = $state(false)
	let loadingLog = $state(false)
	let showCookedModal = $state(false)
	let showHistoryModal = $state(false)
let isCopying = $state(false)
let showCopyConfirm = $state(false)

	const canDuplicate =
		!!viewerUserId &&
		viewOnly &&
		recipe?.userId !== viewerUserId &&
		!recipe?.parentRecipeId &&
		!recipe?.duplicatedByViewer

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

	async function handleLogSubmit(note) {
		loadingLog = true
		let response = await addRecipeLog(recipe?.uid, note, scale)
		loadingLog = false
		showCookedModal = false
		if (response.success) {
			const newLog = response.data
			updateLogs(newLog.recipeLog, response)
		} else {
			console.log('Failed to log recipe!')
		}
	}

function handleDuplicate() {
	if (!canDuplicate) return
	showCopyConfirm = true
}

async function confirmDuplicate() {
	showCopyConfirm = false
	isCopying = true
	const newUid = await duplicateRecipe(recipe?.uid)
	isCopying = false
	if (!newUid) return
	await invalidateAll()
	goto(`/recipe/${newUid}/view/`)
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
		onclick={() => (showCookedModal = true)}
		class="btn btn-soft btn-primary btn-sm tooltip"
		class:text-success={logs?.length > 0}
		data-tip={logs?.length > 0
			? `Cooked ${logs.length} time${logs.length > 1 ? 's' : ''}`
			: 'Mark Recipe Cooked'}
		data-testid="check-button">
		{#if logs?.length > 1}
			<span class="badge badge-success badge-sm text-success-content font-bold min-w-5"
				>{logs.length}</span>
		{:else}
			<Check checked={logs?.length > 0} width="20px" height="20px" fill="currentColor" />
		{/if}
	</button>
	{#if logs?.length > 0}
		<button
			onclick={() => (showHistoryModal = true)}
			class="btn btn-soft btn-primary btn-sm tooltip"
			data-tip="View Cooking History">
			<Calendar width="20px" height="20px" fill="currentColor" />
		</button>
	{/if}
	<button
		onclick={() => handleDelete(recipe?.uid)}
		data-testid="delete-button"
		class="btn btn-soft btn-primary btn-sm tooltip"
		data-tip="Delete Recipe">
		<Delete width="20px" height="20px" fill="currentColor" />
	</button>
{:else}
	{#if viewerUserId}
		<button
			onclick={() => handleFavourite(recipe?.uid)}
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
		{#if canDuplicate}
			<button
				onclick={handleDuplicate}
				class="btn btn-soft btn-primary btn-sm tooltip"
				data-tip="Fork Recipe">
				<Fork width="20px" height="20px" fill="currentColor" />
			</button>
		{:else if recipe?.userId !== viewerUserId}
			<button
				class="btn btn-soft btn-primary btn-sm tooltip opacity-40"
				disabled={true}
				data-tip="Already copied">
				<Fork width="20px" height="20px" fill="currentColor" />
			</button>
		{/if}
	{/if}
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

<CookedLogModal bind:isOpen={showCookedModal} onSubmit={handleLogSubmit} loading={loadingLog} />

<CookedHistoryModal bind:isOpen={showHistoryModal} {logs} {onRestoreScale} />

<ConfirmationDialog
	bind:isOpen={showCopyConfirm}
	onClose={() => (showCopyConfirm = false)}
	onConfirm={confirmDuplicate}>
	{#snippet content()}
		<h3 class="font-bold text-lg">Copy Recipe</h3>
		<p class="py-4">Fork this recipe into your account?</p>
	{/snippet}
</ConfirmationDialog>

<Spinner visible={isCopying} spinnerContent="Copying Recipe" />
