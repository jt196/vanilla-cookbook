// src/lib/utils/import/photoHelpers.js
import path from 'path'
import fs from 'fs'
import { prisma } from '$lib/server/prisma'
import { processImage } from '$lib/utils/image/imageBackend'
import { saveFile, getFileType, uploadDir } from '$lib/utils/import/importHelpers' // uploadDir points to appRoot/uploads/images

async function ensureUploadDir() {
	if (!fs.existsSync(uploadDir)) {
		await fs.promises.mkdir(uploadDir, { recursive: true })
	}
}

/**
 * Generic local saver:
 * - accepts Buffer | ArrayBuffer | base64 string
 * - creates DB row to get id
 * - writes file as uploads/images/{id}.{ext}
 * - DOES NOT set `url` (keeps legacy behavior for local files)
 */
export async function saveLocalPhoto({ data, originalName, recipeUid, setMain }) {
	await ensureUploadDir()
	const ext = getFileType(originalName) || 'jpg'

	const row = await prisma.recipePhoto.create({
		data: { recipeUid, isMain: !!setMain, fileType: ext }
	})

	await saveFile(data, `${row.id}.${ext}`, uploadDir)
	return row
}

// Back-compat helper used by Paprika strategy (now delegates):
async function saveBase64AsPhoto({ base64, filename, recipeUid, setMain }) {
	return saveLocalPhoto({
		data: base64,
		originalName: filename,
		recipeUid,
		setMain
	})
}

export async function downloadUrlAsPhoto({ url, recipeUid, setMain, fileTypeHint }) {
	const type = fileTypeHint || (url ? getFileType(new URL(url).pathname) : undefined) || 'jpg'

	let row = await prisma.recipePhoto.create({
		data: { recipeUid, isMain: !!setMain, fileType: type }
	})

	const ok = await processImage(url, row.id, type) // saves uploads/images/{id}.{type}
	if (!ok) {
		await prisma.recipePhoto.delete({ where: { id: row.id } })
		return null
	}

	// IMPORTANT: do NOT set `url` for local files (keep legacy behavior)
	return row
}

/**
 * Import photos for a single recipe using a strategy:
 * {
 *   base64Main: { filenameKey: 'photo', dataKey: 'photo_data' },
 *   base64List: { listKey: 'photos', filenameKey: 'filename', dataKey: 'data' },
 *   urlOrder: ['photo_url','image_url']
 * }
 */
export async function importPhotosForRecipe({ created, raw, strategy }) {
	let isMainSet = false

	const m = strategy.base64Main
	if (m && raw?.[m.filenameKey] && raw?.[m.dataKey]) {
		await saveBase64AsPhoto({
			base64: raw[m.dataKey],
			filename: raw[m.filenameKey],
			recipeUid: created.uid,
			setMain: true
		})
		isMainSet = true
	}

	const list = strategy.base64List
	if (list && Array.isArray(raw?.[list.listKey])) {
		for (const item of raw[list.listKey]) {
			const filename = item?.[list.filenameKey]
			const base64 = item?.[list.dataKey]
			if (!filename || !base64) continue
			await saveBase64AsPhoto({
				base64,
				filename,
				recipeUid: created.uid,
				setMain: !isMainSet
			})
			if (!isMainSet) isMainSet = true
		}
	}

	if (!isMainSet && Array.isArray(strategy.urlOrder)) {
		for (const key of strategy.urlOrder) {
			const url = raw?.[key]
			if (!url) continue
			const hint = key === 'photo_url' && raw?.photo ? getFileType(raw.photo) : undefined
			const row = await downloadUrlAsPhoto({
				url,
				recipeUid: created.uid,
				setMain: !isMainSet,
				fileTypeHint: hint
			})
			if (row) {
				isMainSet = true
				break
			}
		}
	}

	return isMainSet
}

/** Bulk helper: pairs = [{ created, raw }, ...] */
export async function importPhotosForPairs({ pairs, strategy }) {
	const failed = []
	for (const { created, raw } of pairs) {
		try {
			await importPhotosForRecipe({ created, raw, strategy })
		} catch (e) {
			console.error(`Photo import failed for recipe uid=${created?.uid} name=${raw?.name}`, e)
			if (created?.uid) failed.push(created.uid)
		}
	}
	return failed
}
