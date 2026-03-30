import fs from 'fs'
import path from 'path'
import axios from 'axios'
import pkg from 'js-beautify'
import {
	COMPATIBILITY_DEFAULTS,
	createCompatibilityEntry,
	loadCompatibilityManifest,
	mergeCompatibilityManifestEntries,
	saveCompatibilityJson
} from '$lib/utils/parse/compatibility/index.js'
import { urlToFilename } from './parseTesting.js'

const { html: beautify } = pkg

/**
 * Recipe Downloader and Fixture Utilities
 *
 * The compatibility manifest JSON is the canonical recipe URL corpus.
 * This module keeps manifest helpers and the fixture download helper
 * for one-off HTML snapshot capture.
 */

export function getManifestEntries(manifestPath = COMPATIBILITY_DEFAULTS.manifestPath) {
	return loadCompatibilityManifest(manifestPath)
}

export function addUrlToManifest(
	url,
	{
		statusClass = 'active',
		notes = 'Added manually.',
		manifestPath = COMPATIBILITY_DEFAULTS.manifestPath
	} = {}
) {
	const manifest = getManifestEntries(manifestPath)
	const nextManifest = mergeCompatibilityManifestEntries(
		manifest,
		createCompatibilityEntry(url, statusClass, notes)
	)
	saveCompatibilityJson(manifestPath, nextManifest)
	return nextManifest.find((entry) => entry.url === url)
}

/**
 * Downloads and saves the content from a given URL. If the content contains a recipe in JSON-LD format,
 * only the recipe data is saved. Otherwise, the entire HTML content is saved.
 *
 * @async
 * @param {string} url - The URL to download content from.
 * @returns {Promise<void>}
 */
export async function downloadAndSave(url) {
	const filename = urlToFilename(url)
	const saveDirectory = path.join(process.cwd(), 'src', 'lib', 'data', 'recipe_html')
	const filePath = path.join(saveDirectory, filename)

	if (fs.existsSync(filePath)) {
		console.log(`File ${filename} already exists in ${saveDirectory}. Skipping.`)
		return
	}

	try {
		const response = await axios.get(url, {
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
			}
		})
		const htmlContent = response.data

		const regex = /<script type="application\/ld\+json"(?:\s+class="[^"]*")?>([\s\S]*?)<\/script>/g
		let match
		let recipeData

		while ((match = regex.exec(htmlContent)) !== null) {
			const jsonData = JSON.parse(match[1])

			if (jsonData['@type'] === 'Recipe') {
				recipeData = jsonData
				break
			}

			if (jsonData['@graph']) {
				for (const item of jsonData['@graph']) {
					if (item['@type'] === 'Recipe') {
						recipeData = item
						break
					}
				}
			}

			if (recipeData) break
		}

		if (recipeData) {
			console.log('Found Recipe:', url)
		} else {
			console.error('No recipe data found:', url)
		}

		if (match && match[1]) {
			const jsonData = JSON.parse(match[1])

			if (jsonData['@graph']) {
				recipeData = jsonData['@graph'].find((item) => item['@type'] === 'Recipe')
			} else if (jsonData['@type'] === 'Recipe') {
				recipeData = jsonData
			}
		}

		if (!recipeData) {
			console.error('No recipe data found in the JSON-LD')
		}

		const contentToSave = recipeData
			? `<script type="application/ld+json">\n${JSON.stringify(recipeData, null, 4)}\n</script>`
			: beautify(htmlContent)

		if (!fs.existsSync(saveDirectory)) {
			fs.mkdirSync(saveDirectory, { recursive: true })
		}

		fs.writeFileSync(filePath, contentToSave, 'utf8')
		console.log(`Content from ${url} saved successfully in ${saveDirectory}!`)
	} catch (error) {
		console.error(`Error fetching URL ${url}:`, error)
	}
}
