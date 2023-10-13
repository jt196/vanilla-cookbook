<script>
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'
	import UpArrow from '$lib/components/svg/UpArrow.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import View from '$lib/components/svg/View.svelte'

	import { deletePhotoById, updatePhotos } from '$lib/utils/crud'
	import RecipeImagesItem from '$lib/components/RecipeImagesItem.svelte'

	/**
	 * Data for the current page.
	 * @type {PageData}
	 */
	export let data

	let { recipe } = data

	$: filteredPhotos = (recipe.photos || [])
		.filter((photo) => photo.fileType)
		.sort((a, b) => (b.mainPhoto || 0) - (a.mainPhoto || 0))

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
		try {
			// Determine if the photo being deleted is the main photo.
			const isMainPhotoBeingDeleted = filteredPhotos.some(
				(photo) => photo.id === photoId && photo.isMain
			)
			// Delete photo
			await deletePhotoById(photoId)
			// Optionally, remove the photo from the local state
			filteredPhotos = filteredPhotos.filter((p) => p.id !== photoId)

			// If the main photo was deleted, choose a new main photo.
			if (isMainPhotoBeingDeleted) {
				// Find the next photo where url is null to be the main photo.
				const newMainPhoto = filteredPhotos[0]

				// If a new main photo was found, set it.
				if (newMainPhoto) {
					handleSetMainPhoto(newMainPhoto.id)
				}
			}
		} catch (error) {
			console.error('Error deleting photo:', error.message)
		}
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
