<script>
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'
	import View from '$lib/components/svg/View.svelte'

	import { deletePhotoById, updatePhotos } from '$lib/utils/crud'
	import RecipeImagesItem from '$lib/components/RecipeImagesItem.svelte'
	import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte'

	
	/** @type {{data: PageData}} */
	let { data } = $props();

	let { recipe } = $state(data)

	let photos = $state(data?.recipe?.photos ?? []);

	let filteredPhotos = $state([]);
	let showDeleteConfirm = $state(false)
	let pendingPhotoId = $state(null)

	$effect(() => {
		filteredPhotos = photos
			.filter((photo) => photo.fileType)
			.sort((a, b) => (b.mainPhoto || 0) - (a.mainPhoto || 0));
	});

	async function handleSetMainPhoto(mainPhotoId) {
		// Immediately update local data
		filteredPhotos = filteredPhotos.map((photo) => ({
			...photo,
			isMain: photo.id === mainPhotoId
		}))

		const success = await updatePhotos(filteredPhotos)
		if (!success) {
			console.error('Failed to set the main photo.')
		} else {
			// Handle the success e.g. show a success notification
		}
	}

	async function handleDeletePhoto(photoId) {
		pendingPhotoId = photoId
		showDeleteConfirm = true
	}

	async function saveEditedNotes(photoId, notes) {
		const index = filteredPhotos.findIndex((p) => p.id === photoId)
		if (index !== -1) {
			// Update local state immediately
			filteredPhotos[index].notes = notes

			// Here, send updated photo with notes to backend...
			const success = await updatePhotos(filteredPhotos)

			if (!success) {
				console.error('Failed to update photo notes.')
			}
		}
	}

	async function confirmDelete() {
		const photoId = pendingPhotoId
		showDeleteConfirm = false
		if (!photoId) return
		try {
			const isMainPhotoBeingDeleted = filteredPhotos.some(
				(photo) => photo.id === photoId && photo.isMain
			)
			const success = await deletePhotoById(photoId)
			if (!success) return
			filteredPhotos = filteredPhotos.filter((p) => p.id !== photoId)
			if (isMainPhotoBeingDeleted) {
				const newMainPhoto = filteredPhotos[0]
				if (newMainPhoto) {
					handleSetMainPhoto(newMainPhoto.id)
				}
			}
		} catch (error) {
			console.error('Error deleting photo:', error.message)
		}
	}
</script>

<h3>{recipe?.name}</h3>
<a
	href="/recipe/{recipe?.uid}/view/"
	role="button"
	class="outline contrast"
	data-testid="view-button">
	<View width="30px" height="30px" fill="var(--pico-ins-color)" />
</a>

<div class="grid">
	<div>
		{#if filteredPhotos.length > 0}
			<div class="other-photos">
				{#each filteredPhotos as photo (photo.id)}
					<RecipeImagesItem
						{photo}
						recipeName={recipe?.name}
						onSetMainPhoto={handleSetMainPhoto}
						onDeletePhoto={handleDeletePhoto}
						onSaveEditedNotes={saveEditedNotes} />
				{/each}
			</div>
		{:else}
			No saved photos!
			<FoodBowl width="100%" />
		{/if}
	</div>
</div>

<ConfirmationDialog
	bind:isOpen={showDeleteConfirm}
	onClose={() => (showDeleteConfirm = false)}
	onConfirm={confirmDelete}>
	{#snippet content()}
		<h3 class="font-bold text-lg">Delete Photo</h3>
		<p class="py-4">Are you sure you want to delete this photo?</p>
	{/snippet}
</ConfirmationDialog>
