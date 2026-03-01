import { json } from '@sveltejs/kit'
import { prisma } from '$lib/server/prisma'
import { getOptionalUser } from '$lib/server/authHelpers'
import { deserializeEmbedding, cosineSimilarity } from '$lib/utils/embeddings'
import { resolveSemanticAvailability } from '$lib/server/semanticHelpers'

const SIMILAR_THRESHOLD = 0.3
const MAX_LIMIT = 20

/**
 * GET /api/recipe/[uid]/similar?limit=6
 *
 * Returns recipes with highest cosine similarity to the given recipe.
 * Respects visibility rules: candidates must be public OR owned by the requesting user.
 * Returns empty array when semantic search is disabled.
 *
 * @param {import('@sveltejs/kit').RequestEvent} event
 */
export async function GET({ params, url, locals }) {
	const semanticAvailability = resolveSemanticAvailability(locals)
	if (!semanticAvailability.enabled) {
		return json({ enabled: false, results: [] })
	}

	const limit = Math.min(Math.max(Number(url.searchParams.get('limit') || 6), 1), MAX_LIMIT)
	const { uid } = params

	try {
		// Load the source recipe embedding
		const source = await prisma.recipe.findUnique({
			where: { uid },
			select: { uid: true, embedding: true, is_public: true, userId: true, in_trash: true }
		})

		if (!source || source.in_trash || !source.embedding) {
			return json({ enabled: true, results: [] })
		}

		const user = getOptionalUser(locals)

		// Access check: the requester must be able to see the source recipe
		if (!source.is_public && (!user || (source.userId !== user.userId && !user.isAdmin))) {
			return json({ enabled: true, results: [] })
		}

		// Build visibility filter for candidates
		let whereClause = {
			in_trash: false,
			embedding: { not: null },
			uid: { not: uid } // exclude source
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
				name: true,
				image_url: true,
				embedding: true,
				photos: {
					where: { isMain: true },
					select: { id: true },
					take: 1
				}
			}
		})

		const sourceEmbedding = deserializeEmbedding(source.embedding)
		const scored = []

		for (const candidate of candidates) {
			if (!candidate.embedding) continue
			const embedding = deserializeEmbedding(candidate.embedding)
			const score = cosineSimilarity(sourceEmbedding, embedding)
			if (score >= SIMILAR_THRESHOLD) {
				scored.push({
					uid: candidate.uid,
					name: candidate.name,
					image_url: candidate.image_url,
					photos: candidate.photos,
					score
				})
			}
		}

		scored.sort((a, b) => b.score - a.score)

		const results = scored.slice(0, limit).map(({ uid, name, image_url, photos }) => ({
			uid,
			name,
			image_url,
			photos
		}))

		return json({ enabled: true, results })
	} catch (error) {
		console.error('Similar recipes lookup failed:', error)
		return json({ error: 'Failed to load similar recipes.' }, { status: 500 })
	}
}
