// Generic helpers for file-based imports (zip/gzip parsing + mapping)
import { fileTypeFromStream } from 'file-type'
import { promises as fsPromises } from 'fs'
import { promisify } from 'util'
import { prisma } from '$lib/server/prisma'
import { fileURLToPath } from 'url'
import fs from 'fs'
import path from 'path'
import unzipper from 'unzipper'
import zlib from 'zlib'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
export const __dirname = path.dirname(__filename)

export const appRootPath = process.env.APP_ROOT_PATH || path.join(__dirname, '../../../../..')

export const uploadDir = path.join(appRootPath, 'uploads/images')

const gunzip = promisify(zlib.gunzip)

/** Convert a Node Readable stream to a Buffer */
export function streamToBuffer(stream) {
	return new Promise((resolve, reject) => {
		const chunks = []
		stream.on('data', (c) => chunks.push(c))
		stream.on('end', () => resolve(Buffer.concat(chunks)))
		stream.on('error', reject)
	})
}

/** Open a ZIP archive from a Buffer */
export async function openZipFromBuffer(buffer) {
	return unzipper.Open.buffer(buffer)
}

/**
 * Find entries in a ZIP directory by:
 * - RegExp (tested against entry.path) or
 * - a predicate function (entry) => boolean
 */
export function findZipEntries(directory, patternOrFn) {
	if (patternOrFn instanceof RegExp) {
		return directory.files.filter((f) => patternOrFn.test(f.path))
	}
	if (typeof patternOrFn === 'function') {
		return directory.files.filter(patternOrFn)
	}
	throw new Error('findZipEntries: pass a RegExp or predicate')
}

/** Read a ZIP entry's content as Buffer */
export async function readZipEntryBuffer(entry) {
	return streamToBuffer(entry.stream())
}

/** gunzip a Buffer to a UTF-8 string */
export async function gunzipToString(buffer) {
	const out = await gunzip(buffer)
	return out.toString('utf-8')
}

/** Safe date coercion; falls back to now */
export function toDateSafe(val) {
	if (!val) return new Date()
	const d = new Date(val)
	return isNaN(d.getTime()) ? new Date() : d
}

/**
 * Map a single source object to a new object using a field map:
 *   fieldMap: { srcKey: destKey, ... }
 * Optional transforms per srcKey: { srcKey: (value, src, out) => any }
 * Optional static fields added to every output row.
 */
export function mapByConfig(src, fieldMap, transforms = {}, staticFields = {}) {
	const out = { ...staticFields }
	for (const [srcKey, destKey] of Object.entries(fieldMap)) {
		if (src[srcKey] !== undefined) {
			const t = transforms[srcKey]
			out[destKey] = t ? t(src[srcKey], src, out) : src[srcKey]
		}
	}
	return out
}

/** Map a list of source objects with the same config */
export function mapListByConfig(list, fieldMap, transforms = {}, staticFields = {}) {
	return list.map((src) => mapByConfig(src, fieldMap, transforms, staticFields))
}

/** Extension allow-list check (e.g., [".zip", ".json"]) */
export function allowByExtension(filename, accepts) {
	if (!accepts?.length) return true
	const ext = '.' + (filename?.split('.').pop() || '').toLowerCase()
	return accepts.includes(ext)
}

/** Tiny guard */
export function isArrayOfObjects(arr) {
	return Array.isArray(arr) && arr.every((x) => x && typeof x === 'object')
}

/**
 * Adds recipes to the database.
 * @param {Array} recipes - An array of declared recipes (i.e. recipes
 * stripped of any fields that don't exist on the recipe table in the DB).
 * @param {string} userId - The user's ID.
 * @returns {Promise<Array>} - An array of created recipes.
 */
export async function addRecipesToDB(recipes, userId) {
	const createdRecipes = []
	for (const recipe of recipes) {
		// TODO: $transaction this
		const createdRecipe = await prisma.recipe.create({
			data: {
				...recipe,
				userId: userId
			}
		})
		createdRecipes.push(createdRecipe)
	}
	return createdRecipes
}

/**
 * Validates the file type of a given stream against desired extensions.
 * Check for multiple types: isValidFileType(file, ['zip', 'gzip'])
 * Check for a single type: isValidFileType(file, 'zip')
 *
 * @param {ReadableStream} stream - The stream of the file to be checked.
 * @param {string|string[]} desiredExtensions - The extension(s) to validate against.
 * @returns {Promise<boolean>} A promise that resolves to true if the file type matches
 * any of the desired extensions, false otherwise.
 */
export async function isValidFileType(stream, desiredExtensions) {
	const fileTypeResult = await fileTypeFromStream(stream)

	if (!fileTypeResult) {
		return false
	}

	if (Array.isArray(desiredExtensions)) {
		return desiredExtensions.includes(fileTypeResult.ext)
	}

	return fileTypeResult.ext === desiredExtensions
}

export const validImageTypes = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp']

/**
 * Saves a given file data to a specified filename in a given directory.
 * If the file already exists, this function will not overwrite it.
 * @param {ArrayBuffer|string} fileData - The data of the file to be saved.
 * @param {string} filename - The name of the file to be saved.
 * @param {string} directory - The directory in which to save the file.
 * @throws {Error} If there is an error while saving the file.
 */
export async function saveFile(fileData, filename, directory) {
	const filePath = path.join(directory, filename)

	// Check if the file already exists
	if (!fs.existsSync(filePath)) {
		try {
			// Handle different input types
			if (fileData instanceof ArrayBuffer) {
				// Convert ArrayBuffer to Buffer
				fileData = Buffer.from(fileData)
			} else if (typeof fileData === 'string') {
				// Convert base64 string to Buffer
				fileData = Buffer.from(fileData, 'base64')
			}

			// Write the data to the file
			await fsPromises.writeFile(filePath, fileData)
		} catch (error) {
			console.error('Error saving file:', error)
			throw error // Rethrow the error to handle it at a higher level
		}
	}
}

/**
 * Checks if the given recipes data structure is valid.
 * This function checks if the given data is an array of objects,
 * and if the first object in the array has the required fields.
 * The required fields are:
 *
 * - name: a string
 * @param {Array} recipes - The recipes data structure to be validated.
 * @return {boolean} true if the structure is valid, false otherwise.
 */
export function isValidRecipeStructure(recipes) {
	// We're expecting an array of recipes
	if (!Array.isArray(recipes) || recipes.length === 0) return false

	const firstRecipe = recipes[0]

	// Define required fields and their types
	const requiredFields = {
		name: 'string'
	}

	for (let field in requiredFields) {
		if (typeof firstRecipe[field] !== requiredFields[field]) {
			return false
		}
	}

	return true
}

/** Normalize text for hashing */
export function canonicalizeText(s) {
	return (s ?? '')
		.toString()
		.toLowerCase()
		.replace(/\r\n/g, '\n')
		.replace(/[ \t]+/g, ' ')
		.replace(/\s+\n/g, '\n')
		.trim()
}

/** Cross-source content fingerprint (name+ingredients+directions+source_url) */
export function computeContentFingerprint(obj) {
	const name = canonicalizeText(obj?.name || obj?.title)
	const ingredients = Array.isArray(obj?.ingredients)
		? obj.ingredients.map(canonicalizeText).join('\n')
		: canonicalizeText(obj?.ingredients)
	const directions = Array.isArray(obj?.directions || obj?.instructions)
		? (obj.directions || obj.instructions).map(canonicalizeText).join('\n')
		: canonicalizeText(obj?.directions || obj?.instructions)
	const source_url = canonicalizeText(obj?.source_url || obj?.url || obj?.link)

	const payload = JSON.stringify([name, ingredients, directions, source_url])
	return crypto.createHash('sha256').update(payload).digest('hex')
}

/** Default key chooser: prefer recipe.hash; else fingerprint */
export const defaultRecipeKey = (r) => r?.hash || computeContentFingerprint(r)

/**
 * Pre-insert de-dupe:
 * - keyOf: function(raw) -> string (defaults to defaultRecipeKey)
 * - findExisting: async (keys) -> Set<string> of existing hashes
 * Returns { rawNew, keysNew, existingCount } keeping input order.
 */
export async function preInsertDedupe({ raw, keyOf = defaultRecipeKey, findExisting }) {
	const keys = raw.map((r) => keyOf(r)).filter(Boolean)
	const uniqKeys = Array.from(new Set(keys))
	const existingSet = await findExisting(new Set(uniqKeys))

	const rawNew = []
	const keysNew = []
	for (let i = 0; i < raw.length; i++) {
		const k = keyOf(raw[i])
		if (!k || existingSet.has(k)) continue
		rawNew.push(raw[i])
		keysNew.push(k)
	}
	return { rawNew, keysNew, existingCount: existingSet.size }
}

/** Pair created rows back to raw rows by index (order-preserving insert) */
export const pairByIndex = (created, rawNew) =>
	created.map((cr, i) => ({ created: cr, raw: rawNew[i] }))

/**
 * Extracts the file extension from a given filename.
 *
 * @param {string} filename - The name of the file to extract the extension from.
 * @returns {string} - The file extension.
 */
export function getFileType(filename) {
	return filename.split('.').pop()
}

// Tiny, dependency-free front-matter + body parser for recipe imports.

/** Split `---` front-matter from body. */
export function splitFrontMatter(text) {
	const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
	if (!m) return { fm: '', body: text }
	return { fm: m[1], body: m[2] }
}

/**
 * Parse a very small YAML-ish front-matter:
 * - key: value
 * - key:
 *     - item
 *     - item
 * - key: a, b, c   (comma list)
 * Strings may be quoted; we don’t handle nested objects.
 */
export function parseFrontMatter(fm) {
	const out = {}
	const lines = fm.split(/\r?\n/)
	let i = 0

	const readList = () => {
		const arr = []
		while (i < lines.length) {
			const line = lines[i]
			if (!/^\s*-\s+/.test(line)) break
			arr.push(line.replace(/^\s*-\s+/, '').trim())
			i++
		}
		return arr
	}

	while (i < lines.length) {
		let line = lines[i].trim()
		i++
		if (!line) continue

		const kv = line.match(/^([A-Za-z0-9_-]+)\s*:\s*(.*)$/)
		if (!kv) continue

		const key = kv[1]
		let val = kv[2]

		if (val === '') {
			// block list starts on following lines
			const arr = readList()
			if (arr.length) out[key] = arr
			continue
		}

		// strip single/double quotes
		val = val
			.replace(/^"(.*)"$/, '$1')
			.replace(/^'(.*)'$/, '$1')
			.trim()

		if (key === 'tags') {
			out[key] = val
				.split(',')
				.map((s) => s.trim())
				.filter(Boolean)
		} else {
			out[key] = val
		}
	}
	return out
}

/** Convenience: parse entire markdown file -> { meta, body } */
export function parseFrontMatterMarkdown(markdown) {
	const { fm, body } = splitFrontMatter(markdown)
	return { meta: fm ? parseFrontMatter(fm) : {}, body }
}
