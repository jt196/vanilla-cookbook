import { json } from '@sveltejs/kit'
import { prisma } from '$lib/server/prisma'
import { requireAdmin } from '$lib/server/authHelpers'
import { semanticEmbeddingJobsEnabled } from '$lib/server/semanticHelpers'
import { regenerateRecipeEmbedding } from '$lib/server/semanticEmbedding'
import { resolveEmbeddingModel } from '$lib/utils/llmModels'

export async function POST({ request, locals }) {
	requireAdmin(locals)
	const configuredProvider = locals.site?.semantic?.selectedProvider || null
	const preferredEmbeddingProvider = locals.site?.semantic?.provider || null
	const preferredEmbeddingModel = locals.site?.semantic?.model || null

	if (
		!locals.site?.semantic?.enabled ||
		!semanticEmbeddingJobsEnabled(preferredEmbeddingProvider)
	) {
		// If a provider was explicitly configured but isn't available (missing API key), say so clearly.
		if (configuredProvider && !preferredEmbeddingProvider) {
			console.warn(
				`[semantic] configured embedding provider '${configuredProvider}' is not available — check that the API key is set on the server`
			)
			return json(
				{
					processed: 0,
					failed: 0,
					remaining: 0,
					error: `Embedding provider '${configuredProvider}' is configured but not available. Ensure the API key for '${configuredProvider}' is set as a server environment variable.`,
					code: 'admin.site.msg.embeddingProviderUnavailable'
				},
				{ status: 503 }
			)
		}
		return json(
			{
				processed: 0,
				failed: 0,
				remaining: 0,
				reason: 'Semantic embedding jobs are disabled.',
				reasonCode: 'admin.site.msg.embeddingJobsDisabled'
			},
			{ status: 503 }
		)
	}

	console.info(`[semantic] embedding batch using provider=${preferredEmbeddingProvider}`)

	const body = await request.json().catch(() => ({}))
	const requestedBatchSize = Number(body?.batchSize || 10)
	const batchSize = Math.min(Math.max(requestedBatchSize, 1), 100)
	const force = !!body?.force
	console.info(`[semantic] embedding batch start (batchSize=${batchSize}, force=${force})`)

	const resolvedModel = resolveEmbeddingModel(preferredEmbeddingProvider, preferredEmbeddingModel)
	const whereClause = force
		? { in_trash: false, OR: [{ embedding: null }, { embeddingModel: { not: resolvedModel } }] }
		: { embedding: null, in_trash: false }

	const recipes = await prisma.recipe.findMany({
		where: whereClause,
		select: { uid: true },
		take: batchSize,
		orderBy: { created: 'desc' }
	})

	let processed = 0
	let failed = 0
	let rateLimited = false

	for (const recipe of recipes) {
		try {
			const ok = await regenerateRecipeEmbedding(
				recipe.uid,
				preferredEmbeddingProvider,
				preferredEmbeddingModel
			)
			if (ok) processed++
			else failed++
		} catch (error) {
			console.error('Failed embedding generation for recipe:', recipe.uid, error)
			failed++
			if (error.message?.includes('429') || error.message?.includes('insufficient_quota')) {
				console.warn('[semantic] rate limit / quota error — stopping batch early')
				rateLimited = true
				break
			}
		}

		const done = processed + failed
		if (done > 0 && done % 5 === 0) {
			console.info(`[semantic] embedding batch progress ${done}/${recipes.length}`)
		}
	}

	const remaining = await prisma.recipe.count({
		where: force
			? { in_trash: false, OR: [{ embedding: null }, { embeddingModel: { not: resolvedModel } }] }
			: { embedding: null, in_trash: false }
	})

	console.info(
		`[semantic] embedding batch complete processed=${processed} failed=${failed} remaining=${remaining} rateLimited=${rateLimited}`
	)

	return json({
		processed,
		failed,
		remaining,
		rateLimited
	})
}

export async function GET({ locals }) {
	requireAdmin(locals)

	const preferredEmbeddingProvider = locals.site?.semantic?.provider || null
	const preferredEmbeddingModel = locals.site?.semantic?.model || null
	const resolvedModel = resolveEmbeddingModel(preferredEmbeddingProvider, preferredEmbeddingModel)

	const [remaining, mismatched, total] = await Promise.all([
		prisma.recipe.count({
			where: {
				embedding: null,
				in_trash: false
			}
		}),
		prisma.recipe.count({
			where: {
				in_trash: false,
				embedding: { not: null },
				embeddingModel: { not: resolvedModel }
			}
		}),
		prisma.recipe.count({
			where: {
				in_trash: false
			}
		})
	])

	return json({
		total,
		remaining,
		mismatched,
		completed: Math.max(total - remaining - mismatched, 0)
	})
}
