<script>
	import { fade } from 'svelte/transition'

	/** @type {{message?: string, type?: 'success' | 'error' | 'info' | 'warning', timeout?: number, inline?: boolean, style?: 'standard' | 'outline' | 'soft' | 'dash', direction?: 'vertical' | 'horizontal', showIcon?: boolean, children?: import('svelte').Snippet}} */
	let {
		message = '',
		timeout = 3000,
		type = 'info',
		inline = false,
		style: styleVariant = 'standard',
		direction = 'horizontal',
		showIcon = true,
		children = undefined
	} = $props()

	let timeoutId

	const alertClasses = {
		success: 'alert-success',
		error: 'alert-error',
		info: 'alert-info',
		warning: 'alert-warning'
	}

	const styleClasses = {
		standard: '',
		outline: 'alert-outline',
		soft: 'alert-soft',
		dash: 'alert-dash'
	}

	const directionClasses = {
		vertical: 'alert-vertical',
		horizontal: 'alert-horizontal'
	}

	const icons = {
		info: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="h-6 w-6 shrink-0 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
		success: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`,
		warning: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>`,
		error: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
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
		class={`alert ${alertClasses[type]} ${styleClasses[styleVariant]} ${directionClasses[direction]} ${
			inline
				? 'mt-2 w-full'
				: 'fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[90vw] max-w-md px-4'
		}`}>
		{#if showIcon}
			{@html icons[type]}
		{/if}
		{#if children}
			{@render children()}
		{:else}
			<span>{message}</span>
		{/if}
	</div>
{/if}
