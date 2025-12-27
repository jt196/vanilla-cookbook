<script>
	/**
	 * @type {'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'scheduled' | 'pre-migration' | 'manual'}
	 */
	let {
		variant = 'default',
		/**
		 * @type {'sm' | 'md'}
		 */
		size = 'md',
		class: className = '',
		children
	} = $props()
</script>

<span class="badge {variant} {className}">
	{@render children()}
</span>

<style lang="scss">
	.badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.85em;
		font-weight: 500;

		&.scheduled {
			background-color: var(--pico-primary-background);
			color: var(--pico-primary-inverse);
		}

		&.pre-migration {
			background-color: var(--pico-secondary-background);
			color: var(--pico-secondary-inverse);
		}

		&.manual {
			background-color: var(--pico-contrast-background);
			color: var(--pico-contrast-inverse);
		}

		&.default {
			background-color: var(--pico-muted-color);
			color: var(--pico-background-color);
		}

		&.primary {
			background-color: var(--pico-primary-background);
			color: var(--pico-primary-inverse);
		}

		&.secondary {
			background-color: var(--pico-secondary-background);
			color: var(--pico-secondary-inverse);
		}

		&.success {
			background-color: var(--pico-ins-color);
			color: var(--pico-background-color);
		}

		&.warning {
			background-color: var(--pico-mark-background-color);
			color: var(--pico-mark-color);
		}

		&.error {
			background-color: var(--pico-del-color);
			color: var(--pico-background-color);
		}
	}
</style>
