<script>
	import Delete from '$lib/components/svg/Delete.svelte'
	import UpArrow from '$lib/components/svg/UpArrow.svelte'
	import { deletePhotoById, updatePhotos } from '$lib/utils/crud'
	import FileInput from '$lib/components/ui/Form/FileInput.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte'

	/** @type {{recipe: any, selectedFiles?: File[], onSelectedFilesChange?: (files: File[]) => void, imageExists?: boolean, imageChecked?: boolean}} */
	let {
		recipe,
		selectedFiles = [],
		onSelectedFilesChange,
		imageExists = false,
		imageChecked = false
	} = $props()

	let filteredPhotos = $state([])
	let showDeleteConfirm = $state(false)
	let pendingPhotoId = $state(null)
	let previewUrls = $state([])

	$effect(() => {
		filteredPhotos = recipe && recipe.photos ? recipe.photos.filter((photo) => photo.fileType) : []
	})

	$effect(() => {
		const urls = (selectedFiles ?? []).map((file) => URL.createObjectURL(file))
		previewUrls = urls

		return () => {
			for (const url of urls) {
				URL.revokeObjectURL(url)
			}
		}
	})

	function handleFilesChange(event) {
		const inputEvent = event?.detail ?? event
		const files = Array.from(inputEvent?.target?.files ?? [])
		onSelectedFilesChange && onSelectedFilesChange(files)
	}

	async function handleDeletePhoto(photoId) {
		pendingPhotoId = photoId
		showDeleteConfirm = true
	}

	async function handleSetMainPhoto(mainPhotoId) {
		filteredPhotos = filteredPhotos.map((photo) => ({
			...photo,
			isMain: photo.id === mainPhotoId
		}))

		const success = await updatePhotos(filteredPhotos)
		if (!success) {
			console.error('Failed to set the main photo.')
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

<FileInput
	id="file"
	name="images"
	label="Upload Images"
	accept="image/*"
	multiple={true}
	onchange={handleFilesChange}
	optionalLabel="Images are uploaded after you save the recipe." />

{#if previewUrls?.length}
	<div class="flex flex-wrap gap-3 mb-4 mt-4">
		{#each previewUrls as previewUrl, index}
			<img
				src={previewUrl}
				alt={`Selected image ${index + 1}`}
				class="w-32 h-auto object-cover rounded-lg shadow-md" />
		{/each}
	</div>
{/if}

{#if recipe.image_url && imageExists}
	<img
		class="w-32 h-auto object-cover rounded-lg shadow-md mb-4 mt-4"
		loading="lazy"
		src={recipe.image_url}
		alt="{recipe.image_url} thumbnail" />
{/if}

{#if recipe.image_url && !imageExists && imageChecked}
	<p class="text-warning text-sm mt-2 mb-2">
		The external image URL appears to be unreachable. The image may not display correctly.
	</p>
{/if}

{#if filteredPhotos.length > 0}
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
{/if}

<ConfirmationDialog
	bind:isOpen={showDeleteConfirm}
	onClose={() => (showDeleteConfirm = false)}
	onConfirm={confirmDelete}>
	{#snippet content()}
		<h3 class="font-bold text-lg">Delete Photo</h3>
		<p class="py-4">Are you sure you want to delete this photo?</p>
	{/snippet}
</ConfirmationDialog>
