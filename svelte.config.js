// import adapter from '@sveltejs/adapter-auto'
import adapter from '@sveltejs/adapter-node'
import { vitePreprocess } from '@sveltejs/kit/vite'
import sveltePreprocess from 'svelte-preprocess'
import dotenv from 'dotenv'
dotenv.config()

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: [vitePreprocess(), sveltePreprocess()],

	kit: {
		// adapter: adapter()
		adapter: adapter({ out: 'build' })
	}
}

export default config
