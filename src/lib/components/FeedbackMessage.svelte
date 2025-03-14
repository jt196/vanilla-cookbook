<script>
	import { fade } from 'svelte/transition'

	/** @type {{message?: string}} */
	let {
		message = '',
		timeout = 3000,
		type = 'info',
		background = 'var(--pico-secondary-focus)'
	} = $props()
	let show = $state(false)

	$effect(() => {
		if (message) {
			show = true
			setTimeout(() => {
				show = false
			}, timeout)
		}
	})

	// Define colors based on the message type
	const colors = {
		success: 'var(--pico-ins-color)',
		error: 'var(--pico-del-color)',
		info: 'var(--pico-primary)'
	}
</script>

{#if show && message}
	<div
		transition:fade
		class="feedback-message"
		style="color: {colors[type]}; background-color: {background};">
		{message}
	</div>
{/if}

<style>
	.feedback-message {
		position: fixed;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
		padding: 10px 20px;
		border-radius: 5px;
		font-weight: bold;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
		/* opacity: 0.95; */
		max-width: 80%;
		text-align: center;
	}
</style>
