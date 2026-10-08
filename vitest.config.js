import { defineConfig } from 'vitest/config'
import { sveltekit } from '@sveltejs/kit/vite'
import { svelteTesting } from '@testing-library/svelte/vite'
import path from 'path'

// Svelte component tests need Svelte's browser build, which svelteTesting() enables by adding
// the `browser` resolve condition. That condition breaks server-side packages (e.g. `ws` via
// libsql), so component tests run as their own project.
const componentTests = ['src/**/*.component.test.js', 'src/tests/components.test.js']

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		exclude: ['**/node_modules/**', '**/dist/**', '**/testDist/**', 'src/tests/e2e/**'],
		globals: true,
		environment: 'jsdom',
		projects: [
			{
				extends: true,
				test: {
					name: 'unit',
					include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
					exclude: [...componentTests, '**/node_modules/**', 'src/tests/e2e/**']
				}
			},
			{
				extends: true,
				plugins: [svelteTesting()],
				test: {
					name: 'components',
					include: componentTests
				}
			}
		]
	},
	resolve: {
		alias: {
			$lib: path.resolve(__dirname, './src/lib')
		}
	}
})
