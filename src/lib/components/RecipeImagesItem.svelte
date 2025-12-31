<script>
	import UpArrow from '$lib/components/svg/UpArrow.svelte'
	import Delete from '$lib/components/svg/Delete.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import Input from '$lib/components/ui/Form/Input.svelte'

	/** @type {{photo: any, recipeName?: string, onSetMainPhoto: any, onDeletePhoto: any, onSaveEditedNotes: any}} */
	let {
		photo,
		recipeName = '',
		onSetMainPhoto,
		onDeletePhoto,
		onSaveEditedNotes
	} = $props();

	let editingPhotoId = $state(null)
	let editingPhotoNotes = $state(photo.notes || '')

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
		<Input bind:value={editingPhotoNotes} type="text" placeholder="Enter notes..." />
		<Button onclick={saveNotes}>Save</Button>
		<Button onclick={cancelEditing}>Cancel</Button>
	{:else}
		{photo.notes || 'No notes for this photo.'}
		<Button onclick={startEditing}>Edit</Button>
	{/if}
</div>
<div class="photo-actions">
	<Button class="outline secondary" type="button" onclick={() => onDeletePhoto(photo.id)}>
		<Delete width="30px" height="30px" fill="var(--pico-del-color)" />
	</Button>
	{#if !photo.isMain}
		<div class="tooltip" data-tip="Promote to Main Photo">
			<Button class="outline secondary" type="button" onclick={() => onSetMainPhoto(photo.id)}>
				<UpArrow width="30px" height="30px" fill="var(--pico-primary)" />
			</Button>
		</div>
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
		:global(input) {
			margin-bottom: 0;
		}
		:global(button) {
			margin-left: 10px;
			&:first-child {
				margin-left: auto;
			}
		}
	}
</style>
