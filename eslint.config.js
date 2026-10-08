import js from '@eslint/js'
import svelte from 'eslint-plugin-svelte'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import svelteConfig from './svelte.config.js'

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		ignores: [
			'build/',
			'.svelte-kit/',
			'package/',
			'site/',
			'coverage/',
			'test-results/',
			'playwright-report/',
			'android/',
			'android-web/',
			'docs/',
			'.venv/',
			'plans/',
			'static/',
			'uploads/',
			'src/lib/submodules/',
			'src/lib/data/',
			'src/lib/css.bak/',
			'vite.config.js.timestamp-*'
		]
	},
	js.configs.recommended,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: { ...globals.browser, ...globals.node }
		},
		rules: {
			'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
			// App isn't served under a base path, so resolve() on every href adds nothing
			'svelte/no-navigation-without-resolve': 'off',
			// Keep visible without failing lint; {@html} content is sanitised before render
			'svelte/no-at-html-tags': 'warn',
			'svelte/require-each-key': 'warn',
			'svelte/prefer-writable-derived': 'warn',
			'svelte/prefer-svelte-reactivity': 'warn'
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: { svelteConfig }
		}
	}
]
