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

{#if photo.isMain}
	<img src="/api/recipe/image/{photo.id}" alt="{recipeName} photo" class="main-photo" />
{:else}
	<button type="button" class="promote-btn" onclick={() => onSetMainPhoto(photo.id)}>
		<img src="/api/recipe/image/{photo.id}" alt="{recipeName} photo - click to set as main" class="promotable-photo" />
	</button>
{/if}
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
		width: 100%;
		height: auto;
		object-fit: cover;
		display: block;
		margin-bottom: 1rem;
	}

	.main-photo {
		border: 3px solid var(--pico-primary, oklch(0.6 0.2 260));
		border-radius: 0.5rem;
	}

	.promotable-photo {
		opacity: 0.8;
		transition: opacity 0.2s;
		border-radius: 0.5rem;
		&:hover {
			opacity: 1;
		}
	}

	.promote-btn {
		all: unset;
		cursor: pointer;
		display: block;
		width: 100%;
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
