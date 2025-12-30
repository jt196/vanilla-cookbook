<script>
	import { fade } from 'svelte/transition'

	/** @type {{message?: string, type?: 'success' | 'error' | 'info' | 'warning', timeout?: number, inline?: boolean}} */
	let {
		message = '',
		timeout = 3000,
		type = 'info',
		inline = false
	} = $props()

	let timeoutId

	const alertClasses = {
		success: 'alert-success',
		error: 'alert-error',
		info: 'alert-info',
		warning: 'alert-warning'
	}

	$effect(() => {
		if (message && !inline) {
			clearTimeout(timeoutId) // Prevent overlapping timeouts
			timeoutId = setTimeout(() => {
				message = ''
			}, timeout)
		}
	})
</script>

{#if message}
	<div
		transition:fade
		class="alert {alertClasses[type]} {inline ? 'mt-2' : 'fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md'}">
		<span>{message}</span>
	</div>
{/if}
