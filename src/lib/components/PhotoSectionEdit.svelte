<script>
	import Delete from '$lib/components/svg/Delete.svelte'
	import UpArrow from '$lib/components/svg/UpArrow.svelte'

	import { deletePhotoById, updatePhotos } from '$lib/utils/crud'

	export let recipe
	// export let selectedFiles

	export let selectedFiles

	let filteredPhotos
	$: filteredPhotos = recipe && recipe.photos ? recipe.photos.filter((photo) => photo.fileType) : []

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

	function handleFilesChange(event) {
		selectedFiles = Array.from(event.target.files)
	}
</script>

<label for="file">Upload Images</label>
<input type="file" id="file" name="file" on:change={handleFilesChange} multiple />

<div class="photos">
	{#each filteredPhotos as photo}
		<div class="photo-container">
			<img
				src="/api/recipe/image/{photo.id}"
				alt="{recipe.name} photo"
				class={photo.isMain ? 'main-photo' : ''} />
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
		</div>
	{/each}
</div>

<style lang="scss">
	.photos {
		margin-bottom: 1rem;
		display: flex;
		gap: 10px; /* adjust as needed */
		flex-wrap: wrap;
		img {
			max-height: 150px;
			border-radius: 5px;
		}
		.photo-container {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 5px; /* adjust as needed */
			.photo-actions {
				display: flex;
				gap: 5px; /* adjust as needed */
			}
		}
	}

	.main-photo {
		border: 3px solid var(--pico-muted-color);
	}
</style>
