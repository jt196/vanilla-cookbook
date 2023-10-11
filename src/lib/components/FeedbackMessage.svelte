<script>
	import { fade } from 'svelte/transition'

	export let message = ''
	let show = false

	$: if (message) {
		show = true
		setTimeout(() => {
			show = false
		}, 3000)
	}
</script>

{#if show && message}
	<div transition:fade>
		{message}
	</div>
{/if}
