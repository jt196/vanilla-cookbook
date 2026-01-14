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
		const inputEvent = event?.detail ?? event
		// Convert the FileList to an array of files
		const files = Array.from(inputEvent?.target?.files ?? [])
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

<FileInput id="file" label="Upload Images" name="images" onchange={handleFilesChange} multiple />

<div class="flex flex-wrap gap-3 mb-4 mt-4">
	{#each filteredPhotos as photo}
		<div class="flex flex-col items-center gap-2">
			<img
				src="/api/recipe/image/{photo.id}"
				alt="{recipe.name} photo"
				class="max-h-40 rounded-lg shadow-md {photo.isMain ? 'ring-4 ring-primary' : ''}" />
			<div class="flex gap-2">
				<Button
					size="sm"
					style="soft"
					color="secondary"
					type="button"
					onclick={() => handleDeletePhoto(photo.id)}>
					<Delete width="24px" height="24px" />
				</Button>
				{#if !photo.isMain}
					<div class="tooltip" data-tip="Promote to Main Photo">
						<Button
							size="sm"
							style="soft"
							color="secondary"
							type="button"
							onclick={() => handleSetMainPhoto(photo.id)}>
							<UpArrow width="24px" height="24px" />
						</Button>
					</div>
				{/if}
			</div>
		</div>
	{/each}
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
