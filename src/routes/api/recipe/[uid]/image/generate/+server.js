import { json } from '@sveltejs/kit'
import { prisma } from '$lib/server/prisma'
import { resolveAIConfig, generateImageBuffer } from '$lib/server/aiHelpers'
import { requireAuth, requireOwnership } from '$lib/server/authHelpers'
import { createRecipePhotoEntry, removeRecipePhotoEntry } from '$lib/utils/api'
import { saveFile } from '$lib/utils/import/importHelpers'
import { fileTypeFromBuffer } from 'file-type'

const DEFAULT_STYLE_DESCRIPTION =
	'Photo realistic plated dish, natural lighting, shallow depth of field, clean background, no text, no watermark, no logo.'

/**
 * Build a generation prompt from recipe data and an optional style override.
 *
 * @param {{ name?: string | null, description?: string | null, ingredients?: string | null, directions?: string | null }} recipe
 * @param {string} styleDescription
 * @returns {string}
 */
function buildRecipeImagePrompt(recipe, styleDescription) {
	const recipeName = (recipe?.name || '').trim()
	const description = (recipe?.description || '').trim()
	const ingredients = (recipe?.ingredients || '')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.slice(0, 20)
		.join(', ')
	const directions = (recipe?.directions || '')
		.split('\n')
		.map((line) => line.trim())
		.filter(Boolean)
		.slice(0, 6)
		.join(' ')

	return [
		'Create a photorealistic food photo for this recipe.',
		`Recipe name: ${recipeName || 'Untitled recipe'}.`,
		description ? `Recipe description: ${description}.` : '',
		ingredients ? `Ingredients: ${ingredients}.` : '',
		directions ? `Cooking context: ${directions}.` : '',
		`Style description: ${styleDescription}.`,
		'Keep the dish visually plausible from the listed ingredients.',
		'No text, no watermark, no logos, no branding.'
	]
		.filter(Boolean)
		.join('\n')
}

export async function POST({ request, locals, params }) {
	const user = requireAuth(locals)
	const { uid } = params

	try {
		const recipe = await prisma.recipe.findUnique({
			where: { uid },
			select: {
				uid: true,
				userId: true,
				name: true,
				description: true,
				ingredients: true,
				directions: true
			}
		})
		requireOwnership(user, recipe)

		const body = await request.json().catch(() => ({}))
		const styleDescription =
			typeof body?.styleDescription === 'string' && body.styleDescription.trim()
				? body.styleDescription.trim()
				: DEFAULT_STYLE_DESCRIPTION

		if (!recipe.name?.trim() && !recipe.ingredients?.trim() && !recipe.directions?.trim()) {
			return json(
				{ error: 'Recipe needs a name, ingredients, or directions before image generation.' },
				{ status: 400 }
			)
		}

		const aiConfig = resolveAIConfig(locals, 'imageGeneration')
		if (!aiConfig.ok) return aiConfig.response

		const prompt = buildRecipeImagePrompt(recipe, styleDescription)
		const buffer = await generateImageBuffer(aiConfig, prompt)
		const fileType = await fileTypeFromBuffer(buffer)
		const extension = fileType?.ext || 'png'
		const hasMainPhoto = await prisma.recipePhoto.findFirst({
			where: { recipeUid: uid, isMain: true }
		})

		let photoEntry
		try {
			photoEntry = await createRecipePhotoEntry(uid, null, extension, !hasMainPhoto)
			await saveFile(buffer, `${photoEntry.id}.${extension}`, 'uploads/images')
		} catch (err) {
			if (photoEntry?.id) {
				await removeRecipePhotoEntry(photoEntry.id)
			}
			throw err
		}

		return json({
			success: true,
			photo: {
				id: photoEntry.id,
				recipeUid: photoEntry.recipeUid,
				fileType: photoEntry.fileType,
				isMain: photoEntry.isMain,
				url: photoEntry.url
			}
		})
	} catch (err) {
		if (err?.status) throw err
		console.error('Recipe image generation failed:', err)
		const message = err?.message || 'Failed to generate recipe image.'
		if (message.includes('429') || message.toLowerCase().includes('rate')) {
			return json(
				{ error: 'Rate limit reached. Please wait a moment before trying again.' },
				{ status: 429 }
			)
		}
		return json({ error: message }, { status: 500 })
	}
}
