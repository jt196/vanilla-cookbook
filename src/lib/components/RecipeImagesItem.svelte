<script>
	import UpArrow from '$lib/components/svg/UpArrow.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import { deletePhotoById, updatePhotos } from '$lib/utils/crud'

	export let photo
	export let recipeName = ''
	export let onSetMainPhoto
	export let onDeletePhoto
	export let onSaveEditedNotes

	let editingPhotoId = null
	let editingPhotoNotes = photo.notes || ''

	function startEditing() {
		editingPhotoId = photo.id
	}

	function saveNotes() {
		onSaveEditedNotes(photo.id, editingPhotoNotes)
		editingPhotoId = null
	}

	function cancelEditing() {
		editingPhotoId = null
		editingPhotoNotes = ''
	}
</script>

<img src="/api/recipe/image/{photo.id}" alt="{recipeName} photo" />
<div class="photo-note">
	{#if editingPhotoId === photo.id}
		<input bind:value={editingPhotoNotes} type="text" placeholder="Enter notes..." />
		<button on:click={saveNotes}>Save</button>
		<button on:click={cancelEditing}>Cancel</button>
	{:else}
		{photo.notes || 'No notes for this photo.'}
		<button on:click={startEditing}>Edit</button>
	{/if}
</div>
<div class="photo-actions">
	<button class="outline secondary" type="button" on:click={() => onDeletePhoto(photo.id)}>
		<Delete width="30px" height="30px" fill="var(--pico-del-color)" />
	</button>
	{#if !photo.isMain}
		<button
			class="outline secondary"
			data-tooltip="Promote to Main Photo"
			type="button"
			on:click={() => onSetMainPhoto(photo.id)}>
			<UpArrow width="30px" height="30px" fill="var(--pico-primary)" />
		</button>
	{/if}
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
		button {
			margin-left: 10px;
			&:first-child {
				margin-left: auto;
			}
		}
	}
</style>
