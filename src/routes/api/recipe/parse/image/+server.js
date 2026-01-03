import { extractRecipeWithLLM } from '$lib/utils/ai'
import { fileTypeFromBuffer } from 'file-type'
import { json } from '@sveltejs/kit'
import { resizeImageBuffer, stitchImages } from '$lib/utils/image/imageBackend'

export async function POST({ request }) {
	const formData = await request.formData()
	const files = formData.getAll('image')
	const language = formData.get('language') || 'eng'

	if (!files || files.length === 0) return json({ error: 'No image provided' }, { status: 400 })

	const limitedFiles = files.slice(0, 3)

	try {
		const processedBuffers = []

		for (const file of limitedFiles) {
			const buffer = Buffer.from(await file.arrayBuffer())
			const resizedBuffer = await resizeImageBuffer(buffer, 1024)

			const fileType = await fileTypeFromBuffer(resizedBuffer)
			if (!fileType || !fileType.mime.startsWith('image/')) {
				continue
			}

			processedBuffers.push(resizedBuffer)
		}

		if (processedBuffers.length === 0) {
			return json({ error: 'Invalid image type' }, { status: 400 })
		}

		const stitchedBuffer =
			processedBuffers.length === 1
				? processedBuffers[0]
				: await stitchImages(processedBuffers, { padding: 12, maxWidth: 1400 })

		const recipe = await extractRecipeWithLLM({
			provider: 'openai',
			type: 'image',
			imageBuffer: stitchedBuffer,
			imageMimeType: 'image/png',
			language
		})

		if (!recipe || !recipe.name || !recipe.ingredients?.length) {
			return json({ error: 'Incomplete recipe result.' }, { status: 422 })
		}

		return json({ ...recipe, _source: 'AI', _status: 'complete' })
	} catch (err) {
		console.error('Image parsing failed:', err)
		return json({ error: 'Image parsing failed' }, { status: 500 })
	}
}
