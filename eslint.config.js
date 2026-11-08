import js from '@eslint/js'
import svelte from 'eslint-plugin-svelte'
import jsdoc from 'eslint-plugin-jsdoc'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import svelteConfig from './svelte.config.js'

// Files that predate the JSDoc rule and still have undocumented exported functions.
// Document every exported function in a file, then delete its line here: the list only shrinks.
// (Square brackets are escaped because these are glob patterns.)
const JSDOC_BACKLOG = [
	'src/lib/utils/parse/compatibility/diff.js',
	'src/lib/utils/parse/compatibility/index.js',
	'src/lib/utils/parse/compatibility/llm.js',
	'src/lib/utils/parse/compatibility/runner.js',
	'src/lib/utils/parse/downloadRecipes.js',
	'src/routes/+layout.server.js',
	'src/routes/api/embeddings/generate/+server.js',
	'src/routes/api/health/+server.js',
	'src/routes/api/ingredients/+server.js',
	'src/routes/api/ingredients/shopping/+server.js',
	'src/routes/api/ingredients/shopping/\\[uid\\]/+server.js',
	'src/routes/api/ingredients/shopping/items/+server.js',
	'src/routes/api/log/\\[id\\]/+server.js',
	'src/routes/api/oauth/+server.js',
	'src/routes/api/oauth/callback/+server.js',
	'src/routes/api/recipe/\\[uid\\]/+server.js',
	'src/routes/api/recipe/\\[uid\\]/duplicate/+server.js',
	'src/routes/api/recipe/\\[uid\\]/favourite/+server.js',
	'src/routes/api/recipe/\\[uid\\]/image/generate/+server.js',
	'src/routes/api/recipe/\\[uid\\]/log/+server.js',
	'src/routes/api/recipe/\\[uid\\]/public/+server.js',
	'src/routes/api/recipe/\\[uid\\]/rating/+server.js',
	'src/routes/api/recipe/all/+server.js',
	'src/routes/api/recipe/cleanup/+server.js',
	'src/routes/api/recipe/export/+server.js',
	'src/routes/api/recipe/image/\\[id\\]/+server.js',
	'src/routes/api/recipe/images/+server.js',
	'src/routes/api/recipe/import/types/+server.js',
	'src/routes/api/recipe/parse/+server.js',
	'src/routes/api/recipe/parse/html/+server.js',
	'src/routes/api/recipe/parse/image/+server.js',
	'src/routes/api/recipe/scrape/\\[url\\]/+server.js',
	'src/routes/api/recipe/scrape/youtube/+server.js',
	'src/routes/api/recipe/translate/+server.js',
	'src/routes/api/site/+server.js',
	'src/routes/api/site/backups/+server.js',
	'src/routes/api/site/users/+server.js',
	'src/routes/api/user/\\[id\\]/+server.js',
	'src/routes/api/user/\\[id\\]/admin/+server.js',
	'src/routes/api/user/\\[id\\]/logs/+server.js',
	'src/routes/api/user/\\[id\\]/password/+server.js',
	'src/routes/api/user/\\[id\\]/public/+server.js',
	'src/routes/api/user/\\[id\\]/recipes/+server.js',
	'src/routes/api/user/\\[id\\]/recipes/count/+server.js',
	'src/routes/api/user/\\[id\\]/recipes/privacy/+server.js',
	'src/routes/api/user/admin/users/+server.js',
	'src/routes/new/+page.server.js',
	'src/routes/recipe/(private)/+layout.server.js',
	'src/routes/recipe/(private)/new/+page.server.js',
	'src/routes/recipe/(public)/\\[recipeId\\]/+layout.server.js',
	'src/routes/recipes/+page.server.js',
	'src/routes/register/+page.server.js',
	'src/routes/setup/+page.server.js',
	'src/routes/user/\\[id\\]/(private)/+layout.server.js',
	'src/routes/user/\\[id\\]/(private)/options/+layout.server.js',
	'src/routes/user/\\[id\\]/(private)/options/admin/+layout.server.js',
	'src/routes/user/\\[id\\]/(private)/options/admin/site/+page.server.js',
	'src/routes/user/\\[id\\]/(private)/options/admin/users/+page.server.js',
	'src/routes/user/\\[id\\]/(private)/options/import/+page.server.js',
	'src/routes/user/\\[id\\]/(private)/options/recipes/+page.server.js'
]

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
	},
	{
		// Every exported function needs a JSDoc comment (see CLAUDE.md, Code Style)
		files: ['src/**/*.js'],
		ignores: JSDOC_BACKLOG,
		plugins: { jsdoc },
		rules: {
			'jsdoc/require-jsdoc': [
				'error',
				{
					publicOnly: true,
					require: {
						FunctionDeclaration: true,
						ArrowFunctionExpression: true,
						FunctionExpression: true
					}
				}
			]
		}
	}
]
