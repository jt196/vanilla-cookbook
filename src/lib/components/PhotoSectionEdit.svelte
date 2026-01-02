<script>
	import Delete from '$lib/components/svg/Delete.svelte'
	import UpArrow from '$lib/components/svg/UpArrow.svelte'

	import { deletePhotoById, updatePhotos } from '$lib/utils/crud'
	import FileInput from '$lib/components/ui/Form/FileInput.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte'

	/** @type {{recipe: any, selectedFiles: any}} */
	let { recipe, onSelectedFilesChange } = $props()

	let filteredPhotos = $state()
	let showDeleteConfirm = $state(false)
	let pendingPhotoId = $state(null)

	$effect(() => {
		filteredPhotos = recipe && recipe.photos ? recipe.photos.filter((photo) => photo.fileType) : []
	})

	async function handleDeletePhoto(photoId) {
		pendingPhotoId = photoId
		showDeleteConfirm = true
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
		// Convert the FileList to an array of files
		const files = Array.from(event.target.files)
		// Use the callback to notify the parent of the change
		onSelectedFilesChange && onSelectedFilesChange(files)
	}

	async function confirmDelete() {
		const photoId = pendingPhotoId
		showDeleteConfirm = false
		if (!photoId) return
		try {
			// Determine if the photo being deleted is the main photo.
			const isMainPhotoBeingDeleted = filteredPhotos.some(
				(photo) => photo.id === photoId && photo.isMain
			)
			const photoDeleted = await deletePhotoById(photoId)
			if (!photoDeleted) return

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

<FileInput id="file" label="Upload Images" name="file" onchange={handleFilesChange} multiple />

<div class="photos">
	{#each filteredPhotos as photo}
		<div class="photo-container">
			<img
				src="/api/recipe/image/{photo.id}"
				alt="{recipe.name} photo"
				class={photo.isMain ? 'main-photo' : ''} />
			<div class="photo-actions">
				<Button class="outline secondary" type="button" onclick={() => handleDeletePhoto(photo.id)}>
					<Delete width="30px" height="30px" fill="var(--pico-del-color)" />
				</Button>
				{#if !photo.isMain}
					<div class="tooltip" data-tip="Promote to Main Photo">
						<Button class="outline secondary" type="button" onclick={() => handleSetMainPhoto(photo.id)}>
							<UpArrow width="30px" height="30px" fill="var(--pico-primary)" />
						</Button>
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
