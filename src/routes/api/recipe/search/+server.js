import { json } from '@sveltejs/kit'
import { resolveSemanticAvailability } from '$lib/server/semanticHelpers'
import { prisma } from '$lib/server/prisma'
import { getOptionalUser } from '$lib/server/authHelpers'
import { getEmbedding, deserializeEmbedding, cosineSimilarity } from '$lib/utils/embeddings'

/**
 * Semantic recipe search endpoint (scaffold).
 *
 * Current behavior:
 * - Returns empty result set when semantic is disabled
 * - Validates input and returns empty result set when enabled
 *
 * This allows frontend integration to land without introducing overhead.
 */
export async function GET({ url, locals }) {
	const query = (url.searchParams.get('q') || '').trim()
	const mode = (url.searchParams.get('mode') || 'semantic').toLowerCase()
	const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 20), 1), 100)
	const parsedThreshold = Number(url.searchParams.get('threshold') || 0.2)
	const threshold = Number.isFinite(parsedThreshold) ? parsedThreshold : 0.2

	if (!query) {
		return json(
			{ error: 'Query required.', code: 'recipe.msg.searchQueryRequired' },
			{ status: 400 }
		)
	}
	if (query.length < 2) {
		return json({ enabled: true, mode, results: [] })
	}

	if (!['semantic', 'hybrid', 'keyword'].includes(mode)) {
		return json(
			{ error: 'Invalid search mode.', code: 'recipe.msg.searchInvalidMode' },
			{ status: 400 }
		)
	}
	if (mode === 'keyword') {
		return json({ enabled: true, mode, results: [] })
	}

	const semanticAvailability = resolveSemanticAvailability(locals)
	if (!semanticAvailability.enabled) {
		return json({
			enabled: false,
			mode,
			results: [],
			reason: semanticAvailability.reason,
			reasonCode: semanticAvailability.code
		})
	}

	try {
		const user = getOptionalUser(locals)

		let whereClause = {
			in_trash: false,
			embedding: { not: null }
		}

		if (!user) {
			whereClause = { ...whereClause, is_public: true }
		} else if (!user.isAdmin) {
			whereClause = {
				...whereClause,
				OR: [{ userId: user.userId }, { is_public: true }]
			}
		}

		const candidates = await prisma.recipe.findMany({
			where: whereClause,
			select: {
				uid: true,
				embedding: true
			}
		})

		const preferredEmbeddingProvider = locals.site?.semantic?.provider || null
		const preferredEmbeddingModel = locals.site?.semantic?.model || null
		const queryEmbedding = await getEmbedding(
			query,
			preferredEmbeddingProvider,
			preferredEmbeddingModel
		)
		if (!queryEmbedding) {
			return json({
				enabled: true,
				mode,
				results: [],
				reason: 'No embedding provider configured.',
				reasonCode: 'recipe.msg.searchNoEmbeddingProvider'
			})
		}

		const results = []
		for (const candidate of candidates) {
			if (!candidate.embedding) continue
			const embedding = deserializeEmbedding(candidate.embedding)
			if (embedding.length !== queryEmbedding.length) continue
			const score = cosineSimilarity(queryEmbedding, embedding)
			if (score >= threshold) {
				results.push({ uid: candidate.uid, score })
			}
		}

		results.sort((a, b) => b.score - a.score)

		return json({
			enabled: true,
			mode,
			results: results.slice(0, limit)
		})
	} catch (error) {
		console.error('Semantic recipe search failed:', error)
		return json(
			{ error: 'Semantic search failed.', code: 'recipe.msg.searchFailed' },
			{ status: 500 }
		)
	}
}
