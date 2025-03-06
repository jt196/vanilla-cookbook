module.exports = {
	root: true,
	extends: ['eslint:recommended', 'prettier'],
	plugins: ['svelte'],
	ignorePatterns: ['*.cjs'],
	overrides: [
		{
			files: ['*.svelte'],
			processor: 'svelte/svelte'
		}
	],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020
	},
	rules: {
		'no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
	},
	env: {
		browser: true,
		es2017: true,
		node: true
	}
}
