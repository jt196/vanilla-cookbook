import { describe, it, expect, vi } from 'vitest'
import fs from 'fs'
import path from 'path'
import { parseRecipe } from '$lib/utils/parse/recipeParse.js'

/**
 * Golden snapshot of parseRecipe() over every saved HTML fixture.
 *
 * Any change to parsing output shows up as a diff in
 * __snapshots__/recipeParse.golden.json. If the change is intended (e.g. a parser
 * improvement), review the diff and update with `pnpm test -- -u`.
 */
const FIXTURE_DIR = path.resolve('src/lib/data/recipe_html')
const MANIFEST = path.resolve('src/lib/data/compatibility/scrape-compatibility.manifest.json')

describe('parseRecipe golden snapshot', () => {
	it('produces the same output for every saved fixture', async () => {
		const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
		const urlFor = Object.fromEntries(manifest.map((m) => [m.expected_fixture_filename, m.url]))

		vi.spyOn(console, 'log').mockImplementation(() => {})
		vi.spyOn(console, 'error').mockImplementation(() => {})

		const results = {}
		for (const file of fs.readdirSync(FIXTURE_DIR).sort()) {
			const html = fs.readFileSync(path.join(FIXTURE_DIR, file), 'utf8')
			results[file] = parseRecipe(html, urlFor[file] || '')
		}

		vi.restoreAllMocks()
		await expect(JSON.stringify(results, null, 1) + '\n').toMatchFileSnapshot(
			'./__snapshots__/recipeParse.golden.json'
		)
	}, 60000)
})
