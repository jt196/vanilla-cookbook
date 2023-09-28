<script>
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'
	import UpArrow from '$lib/components/svg/UpArrow.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import View from '$lib/components/svg/View.svelte'

	import { deletePhotoById, updatePhotos } from '$lib/utils/crud'

	/**
	 * Data for the current page.
	 * @type {PageData}
	 */
	export let data

	let { recipe } = data

	let editingPhotoId = null
	let editingPhotoNotes = ''

	$: filteredPhotos = (recipe.photos || [])
		.filter((photo) => photo.url === null)
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

	function startEditing(photo) {
		editingPhotoId = photo.id
		editingPhotoNotes = photo.notes || ''
	}

	async function saveEditedNotes(photoId) {
		const index = filteredPhotos.findIndex((p) => p.id === photoId)
		if (index !== -1) {
			// Update local state immediately
			filteredPhotos[index].notes = editingPhotoNotes

			// Here, send updated photo with notes to backend...
			const success = await updatePhotos(filteredPhotos)

			if (!success) {
				console.error('Failed to update photo notes.')
			} else {
				// Reset editing state
				editingPhotoId = null
				editingPhotoNotes = ''
				// Optionally, show a success notification
			}
		}
	}

	function cancelEditing() {
		editingPhotoId = null
		editingPhotoNotes = ''
	}
</script>

<h3>{recipe?.name}</h3>
<a href="/{recipe?.uid}/view/" role="button" class="outline contrast" data-testid="view-button">
	<View width="30px" height="30px" fill="var(--pico-ins-color)" />
</a>

<div class="grid">
	<div>
		{#if filteredPhotos.length > 0}
			<div class="other-photos">
				{#each filteredPhotos as photo (photo.id)}
					<img src="/api/recipe/image/{photo.id}" alt="{recipe.name} photo" />

					<div class="photo-note">
						{#if editingPhotoId === photo.id}
							<input bind:value={editingPhotoNotes} type="text" placeholder="Enter notes..." />
							<button on:click={() => saveEditedNotes(photo.id)}>Save</button>
							<button on:click={() => cancelEditing()}>Cancel</button>
						{:else}
							{photo.notes || 'No notes for this photo.'}
							<button on:click={() => startEditing(photo)}>Edit</button>
						{/if}
					</div>
					<div class="photo-actions">
						<button
							class="outline secondary"
							type="button"
							on:click={() => handleDeletePhoto(photo.id)}>
							<Delete width="30px" height="30px" fill="var(--pico-del-color)" />
						</button>
						{#if !photo.isMain}
							<button
								class="outline secondary"
								data-tooltip="Promote to Main Photo"
								type="button"
								on:click={() => handleSetMainPhoto(photo.id)}>
								<UpArrow width="30px" height="30px" fill="var(--pico-primary)" />
							</button>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			No saved photos!
			<FoodBowl width="100%" />
		{/if}
	</div>
</div>

<style lang="scss">
	img {
		width: 100%; /* Set to your desired height */
		height: auto; /* This will ensure the width remains proportional */
		object-fit: cover;
		display: block; /* To remove any default spacing at the bottom of images */
		margin-bottom: 1rem;
	}

	.photo-note {
		border: 1px solid gray;
		padding: 10px;
		margin: 10px 0;
		display: flex;
		align-items: center;
		input {
			margin-bottom: 0;
		}
	}

	.photo-note button {
		margin-left: 10px;
		&:first-child {
			margin-left: auto;
		}
	}
</style>
