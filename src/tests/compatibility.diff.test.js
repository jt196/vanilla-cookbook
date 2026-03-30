import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import {
	buildCompatibilityDiff,
	parseRecipeScrapersSupportedSitesHtml
} from '$lib/utils/parse/compatibility/diff.js'

const tempDirectories = []

afterEach(() => {
	for (const directory of tempDirectories.splice(0)) {
		fs.rmSync(directory, { recursive: true, force: true })
	}
})

describe('recipe-scrapers supported sites parsing', () => {
	it('extracts normalized domains from the supported sites page html', () => {
		const html = `
			<main>
				<article>
					<ul>
						<li><a href="/example">www.bbcgoodfood.com</a></li>
						<li><a href="/example">101cookbooks.com</a></li>
						<li><a href="/example">www.bbcgoodfood.com</a></li>
					</ul>
				</article>
			</main>
		`

		expect(parseRecipeScrapersSupportedSitesHtml(html)).toEqual([
			'101cookbooks.com',
			'bbcgoodfood.com'
		])
	})
})

describe('compatibility diff generation', () => {
	it('builds a reviewable new-domain diff against the manifest', () => {
		const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'compatibility-diff-'))
		tempDirectories.push(tempDir)

		const manifestEntries = [
			{
				site: 'bbcgoodfood.com',
				url: 'https://www.bbcgoodfood.com/recipes/example',
				expected_fixture_filename: 'bbcgoodfood.html',
				status_class: 'legacy_reference',
				has_site_config: false
			}
		]

		fs.writeFileSync(path.join(tempDir, 'bbcgoodfood.html'), '<html></html>')

		const diff = buildCompatibilityDiff({
			upstreamDomains: ['101cookbooks.com', 'bbcgoodfood.com', 'newsite.example'],
			manifestEntries,
			fixtureDirectory: tempDir,
			outputPath: 'ignored.json'
		})

		expect(diff.newDomainCount).toBe(2)
		expect(diff.candidates.map((entry) => entry.domain)).toEqual([
			'101cookbooks.com',
			'newsite.example'
		])
		expect(diff.candidates[0].review_action).toBe('consider_adding')
		expect(diff.candidates[0].suggested_status).toBe('legacy_reference')
	})
})
