<script>
	import { deletePhotoById, updatePhotos } from '$lib/utils/crud'
	import FileInput from '$lib/components/ui/Form/FileInput.svelte'
	import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte'

	/** @type {{recipe: any, selectedFiles?: File[], onSelectedFilesChange?: (files: File[]) => void, imageExists?: boolean, imageChecked?: boolean, saveImageUrl?: boolean}} */
	let {
		recipe,
		selectedFiles = [],
		onSelectedFilesChange,
		imageExists = false,
		imageChecked = false,
		saveImageUrl = $bindable(true)
	} = $props()

	let filteredPhotos = $derived(recipe?.photos?.filter((p) => p.fileType) ?? [])
	let imageAlreadySaved = $derived(
		recipe.image_url && filteredPhotos.some((photo) => photo.url === recipe.image_url)
	)

	let showDeleteConfirm = $state(false)
	let pendingPhotoId = $state(null)
	let previewUrls = $state([])
	let imageBroken = $state(false)

	$effect(() => {
		// Reset broken flag when URL changes
		recipe.image_url
		imageBroken = false
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
		const updated = filteredPhotos.map((photo) => ({
			...photo,
			isMain: photo.id === mainPhotoId
		}))

		// Update recipe.photos so derived state refreshes
		if (recipe.photos) {
			recipe.photos = recipe.photos.map((photo) => ({
				...photo,
				isMain: photo.id === mainPhotoId
			}))
		}

		const success = await updatePhotos(updated)
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

			// Update recipe.photos so derived state refreshes
			if (recipe.photos) {
				recipe.photos = recipe.photos.filter((p) => p.id !== photoId)
			}

			if (isMainPhotoBeingDeleted) {
				const remaining = recipe.photos?.filter((p) => p.fileType) ?? []
				if (remaining.length > 0) {
					handleSetMainPhoto(remaining[0].id)
				}
			}
		} catch (error) {
			console.error('Error deleting photo:', error.message)
		}
	}
</script>

<div class="rounded-field border border-solid border-accent p-2">
	<!-- 1. External Image URL -->
	{#if recipe.image_url}
		<div class="mb-4 mt-4">
			<h4 class="text-sm font-semibold mb-2">Source URL Image</h4>
			{#if imageExists}
				{#if imageBroken}
					<div class="w-32 h-24 rounded-lg shadow-md mb-2 bg-base-300 flex items-center justify-center">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
					</div>
				{:else}
					<img
						class="w-32 h-auto object-cover rounded-lg shadow-md mb-2"
						loading="lazy"
						src={recipe.image_url}
						alt=""
						onerror={() => (imageBroken = true)} />
				{/if}
			{/if}
			{#if !imageExists && imageChecked}
				<div class="alert alert-warning py-2 px-3 text-sm">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4 shrink-0"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
					</svg>
					<div>
						<p class="font-semibold">Image unreachable</p>
						<p class="text-xs break-all opacity-70">{recipe.image_url}</p>
					</div>
				</div>
			{/if}
			{#if imageAlreadySaved}
				<span class="badge badge-success badge-sm">Already saved</span>
			{:else if imageExists}
				<label class="label cursor-pointer justify-start gap-2 mt-1">
					<input
						type="checkbox"
						class="checkbox checkbox-sm checkbox-primary"
						bind:checked={saveImageUrl} />
					<span class="label-text text-sm">Save to recipe</span>
				</label>
			{/if}
		</div>
	{/if}

	<!-- 2. Upload Images -->
	<div class="mb-4">
		<h4 class="text-sm font-semibold mb-2">Image Upload</h4>
		<FileInput
			id="file"
			name="images"
			accept="image/*"
			fullWidth="false"
			multiple={true}
			onchange={handleFilesChange} />

		{#if previewUrls?.length}
			<div class="flex flex-wrap gap-3 mt-3">
				{#each previewUrls as previewUrl, index}
					<img
						src={previewUrl}
						alt={`Selected image ${index + 1}`}
						class="w-32 h-auto object-cover rounded-lg shadow-md" />
				{/each}
			</div>
		{/if}
	</div>

	<!-- 3. Saved Images -->
	{#if filteredPhotos.length > 0}
		<div class="mb-4">
			<h4 class="text-sm font-semibold mb-2">Recipe Images</h4>
			<div class="flex flex-wrap gap-3">
				{#each filteredPhotos as photo}
					<div class="indicator">
						<span
							class="indicator-item badge badge-error badge-xs cursor-pointer"
							onclick={() => handleDeletePhoto(photo.id)}
							role="button"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && handleDeletePhoto(photo.id)}>✕</span>
						{#if photo.isMain}
							<img
								src="/api/recipe/image/{photo.id}"
								alt="{recipe.name} photo"
								class="max-h-40 rounded-lg shadow-md ring-4 ring-primary" />
						{:else}
							<button
								type="button"
								class="btn btn-ghost p-0 h-auto min-h-0"
								onclick={() => handleSetMainPhoto(photo.id)}>
								<img
									src="/api/recipe/image/{photo.id}"
									alt="{recipe.name} photo - click to set as main"
									class="max-h-40 rounded-lg shadow-md opacity-80 hover:opacity-100 transition-opacity" />
							</button>
						{/if}
					</div>
				{/each}
			</div>
			<span class="label block whitespace-normal wrap-break-word text-sm leading-snug max-w-full">
				Click on an image to set main.
			</span>
		</div>
	{/if}
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
