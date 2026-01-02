<script>
	import FeedbackMessage from '$lib/components/FeedbackMessage.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import { changeRecipePublic } from '$lib/utils/crud'
	import { onMount } from 'svelte'
	import Share from './svg/Share.svelte'

	let { name, isPublic = true, uid, pubRecipe } = $props()

	const shareSupported = typeof navigator !== 'undefined' && !!navigator.share
	let baseUrl = ''

	onMount(() => {
		baseUrl = window.location.origin
	})

	let feedback = $state('')
	let showConfirmDialog = $state(false)

	let url = $derived(`${baseUrl}/recipe/${uid}/view`)

	async function share() {
		if (!isPublic) {
			showConfirmDialog = true
			return
		}

		await doShare()
	}

	async function doShare() {
		if (shareSupported) {
			try {
				await navigator.share({
					title: `Vanilla Cookbook recipe: ${name}`,
					text: `Check out this Vanilla Cookbook share:\n\n${name}`,
					url
				})
			} catch (err) {
				console.error('Share failed:', err)
			}
		} else {
			try {
				await navigator.clipboard.writeText(`Vanilla Recipe share:\n\n${name}\n\n${url}`)
				showConfirmDialog = false
				feedback = 'Link copied to clipboard!'
			} catch (err) {
				console.error('Clipboard copy failed:', err)
				showConfirmDialog = false
				feedback = 'Failed to copy link.'
			}
		}
	}

	async function confirmMakePublic() {
		const success = await changeRecipePublic(uid)

		if (success) {
			pubRecipe(success)
			showConfirmDialog = false
			await doShare()
		} else {
			feedback = 'Failed to make recipe public.'
			showConfirmDialog = false
		}
	}

	function cancelShare() {
		showConfirmDialog = false
	}
</script>

<button onclick={share} class="btn btn-soft btn-sm tooltip btn-primary" data-tip="Share Recipe">
	<Share width="20px" height="20px" fill="currentColor" />
</button>

<FeedbackMessage message={feedback} type="info" />

<Dialog bind:isOpen={showConfirmDialog}>
	<h3 class="font-bold text-lg">Make Recipe Public?</h3>
	<p class="py-4">
		This recipe is currently private. Would you like to make it public so it can be shared?
	</p>
	<div class="modal-action">
		<button class="btn btn-outline" onclick={cancelShare}>Cancel</button>
		<button class="btn btn-primary" onclick={confirmMakePublic}>Make Public & Share</button>
	</div>
</Dialog>
