<script>
	import FoodBowl from '$lib/components/svg/FoodBowl.svelte'
	import { deletePhotoById, updatePhotos } from '$lib/utils/crud'
	import ConfirmationDialog from '$lib/components/ConfirmationDialog.svelte'

	/** @type {{data: any}} */
	let { data } = $props()

	let { recipe, viewMode } = $state(data)

	let filteredPhotos = $state(
		(data?.recipe?.photos ?? [])
			.filter((photo) => photo.fileType)
			.sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0))
	)

	let showDeleteConfirm = $state(false)
	let pendingPhotoId = $state(null)
	let editingPhotoId = $state(null)
	let editingNotes = $state('')

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

	function handleDeletePhoto(photoId) {
		pendingPhotoId = photoId
		showDeleteConfirm = true
	}

	function startEditingNotes(photo) {
		editingPhotoId = photo.id
		editingNotes = photo.notes || ''
	}

	async function saveNotes() {
		const index = filteredPhotos.findIndex((p) => p.id === editingPhotoId)
		if (index !== -1) {
			filteredPhotos[index].notes = editingNotes
			const success = await updatePhotos(filteredPhotos)
			if (!success) {
				console.error('Failed to update photo notes.')
			}
		}
		editingPhotoId = null
	}

	function cancelEditingNotes() {
		editingPhotoId = null
		editingNotes = ''
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
			if (isMainPhotoBeingDeleted && filteredPhotos.length > 0) {
				handleSetMainPhoto(filteredPhotos[0].id)
			}
		} catch (error) {
			console.error('Error deleting photo:', error.message)
		}
	}
</script>

<div class="mb-4">
	<h3 class="text-2xl font-semibold mb-2">{recipe?.name}</h3>
	<a href="/recipe/{recipe?.uid}/view/" class="btn btn-soft btn-secondary btn-sm">View Recipe</a>
</div>

{#if filteredPhotos.length > 0}
	<div class="carousel w-full rounded-lg">
		{#each filteredPhotos as photo, index (photo.id)}
			<div id="slide{index}" class="carousel-item relative w-full justify-center">
				<div class="flex flex-col items-center p-3">
					<div class="indicator">
						{#if !viewMode}
							<span
								class="indicator-item badge badge-error badge-sm cursor-pointer z-10"
								onclick={() => handleDeletePhoto(photo.id)}
								role="button"
								tabindex="0"
								onkeydown={(e) => e.key === 'Enter' && handleDeletePhoto(photo.id)}>✕</span>
						{/if}
						{#if !viewMode && !photo.isMain}
							<button
								type="button"
								class="btn btn-ghost p-0 h-auto min-h-0"
								onclick={() => handleSetMainPhoto(photo.id)}>
								<img
									src="/api/recipe/image/{photo.id}"
									alt="{recipe.name} photo - click to set as main"
									class="max-h-[70vh] object-contain rounded-lg opacity-80 hover:opacity-100 transition-opacity" />
							</button>
						{:else}
							<img
								src="/api/recipe/image/{photo.id}"
								alt="{recipe.name} photo"
								class="max-h-[70vh] object-contain rounded-lg {photo.isMain ? 'ring-4 ring-primary' : ''}" />
						{/if}
					</div>
					{#if !viewMode}
						<div class="mt-2 flex items-center gap-2">
							{#if editingPhotoId === photo.id}
								<input
									type="text"
									class="input input-sm input-bordered w-48"
									bind:value={editingNotes}
									placeholder="Enter notes..." />
								<button type="button" class="btn btn-xs btn-primary" onclick={saveNotes}>Save</button>
								<button type="button" class="btn btn-xs btn-ghost" onclick={cancelEditingNotes}>Cancel</button>
							{:else}
								<p class="text-xs text-base-content/70 italic">{photo.notes || 'No notes'}</p>
								<button type="button" class="btn btn-xs btn-ghost" onclick={() => startEditingNotes(photo)}>Edit</button>
							{/if}
						</div>
					{:else if photo.notes}
						<p class="text-xs text-base-content/70 mt-2 text-center italic">{photo.notes}</p>
					{/if}
				</div>
				{#if filteredPhotos.length > 1}
					<div class="absolute left-2 right-2 top-1/2 flex -translate-y-1/2 transform justify-between pointer-events-none">
						<a
							href="#slide{(index - 1 + filteredPhotos.length) % filteredPhotos.length}"
							class="btn btn-circle btn-sm opacity-70 hover:opacity-100 pointer-events-auto">❮</a>
						<a
							href="#slide{(index + 1) % filteredPhotos.length}"
							class="btn btn-circle btn-sm opacity-70 hover:opacity-100 pointer-events-auto">❯</a>
					</div>
				{/if}
			</div>
		{/each}
	</div>
	{#if filteredPhotos.length > 1}
		<div class="flex w-full justify-center gap-2 py-3">
			{#each filteredPhotos as _, index}
				<a href="#slide{index}" class="btn btn-xs">{index + 1}</a>
			{/each}
		</div>
	{/if}
{:else}
	<p class="text-base-content/70">No saved photos!</p>
	<FoodBowl width="100%" />
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
