import { extractRecipeWithLLM } from '$lib/utils/ai'
import { fileTypeFromBuffer } from 'file-type'
import { json } from '@sveltejs/kit'
import { resizeImageBuffer } from '$lib/utils/image/imageBackend'

export async function POST({ request }) {
	const formData = await request.formData()
	const file = formData.get('image')

	if (!file) return json({ error: 'No image provided' }, { status: 400 })

	const buffer = Buffer.from(await file.arrayBuffer())
	const resizedBuffer = await resizeImageBuffer(buffer, 1024)

	const fileType = await fileTypeFromBuffer(resizedBuffer)
	if (!fileType || !fileType.mime.startsWith('image/')) {
		return json({ error: 'Invalid image type' }, { status: 400 })
	}

	try {
		const recipe = await extractRecipeWithLLM({
			provider: 'openai',
			type: 'image',
			imageBuffer: resizedBuffer,
			imageMimeType: fileType.mime
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
