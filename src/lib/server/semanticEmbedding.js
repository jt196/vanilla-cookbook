import { prisma } from '$lib/server/prisma'
import { semanticEmbeddingJobsEnabled } from '$lib/server/semanticHelpers'
import { env } from '$env/dynamic/private'
import { resolveEmbeddingProvider, resolveEmbeddingModel } from '$lib/utils/llmModels'
import { getEmbedding, prepareRecipeText, serializeEmbedding } from '$lib/utils/embeddings'

/**
 * Regenerate embedding for a single recipe by uid.
 *
 * @param {string} uid
 * @returns {Promise<boolean>} true if embedding updated
 */
export async function regenerateRecipeEmbedding(
	uid,
	preferredProvider = null,
	preferredModel = null
) {
	if (!semanticEmbeddingJobsEnabled(preferredProvider)) return false

	const recipe = await prisma.recipe.findUnique({
		where: { uid },
		select: {
			uid: true,
			name: true,
			description: true,
			ingredients: true,
			directions: true,
			notes: true,
			source: true
		}
	})

	if (!recipe) return false

	const text = prepareRecipeText(recipe)
	if (!text) return false

	const embedding = await getEmbedding(text, preferredProvider, preferredModel)
	if (!embedding) return false

	const provider = resolveEmbeddingProvider(preferredProvider, env)
	if (!provider) return false

	await prisma.recipe.update({
		where: { uid },
		data: {
			embedding: serializeEmbedding(embedding),
			embeddingModel: resolveEmbeddingModel(provider, preferredModel),
			embeddingVersion: {
				increment: 1
			}
		}
	})

	return true
}
