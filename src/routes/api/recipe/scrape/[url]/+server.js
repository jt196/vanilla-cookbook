import { parseURL } from '$lib/utils/parse/recipeParse'
import { extractRecipeWithLLM } from '$lib/utils/ai'
import { resolveAIConfig } from '$lib/server/aiHelpers'
import { isBlockedVideoUrl } from '$lib/utils/parse/videoHelpers'

export async function GET({ params, locals }) {
	const url = decodeURIComponent(params.url)
	const reqId = crypto.randomUUID().slice(0, 8)
	const startedAt = Date.now()
	let scrapedRecipe = null
	let html = ''
	let scrapeError = null
	console.log(`[scrape:${reqId}] start`, { url })

	const blockedPlatform = isBlockedVideoUrl(url)
	if (blockedPlatform) {
		return jsonResponse(
			{ message: null, code: `recipeNew.msg.${blockedPlatform.platform}Blocked` },
			422
		)
	}

	try {
		console.log(`[scrape:${reqId}] Attempting regular scrape`)
		const result = await parseURL(url)
		scrapedRecipe = result.parsedHTML
		html = result.html

		if (
			scrapedRecipe &&
			typeof scrapedRecipe === 'object' &&
			scrapedRecipe.name &&
			scrapedRecipe.ingredients?.length > 0
		) {
			console.log(`[scrape:${reqId}] Regular scrape success`, {
				ms: Date.now() - startedAt,
				hasName: !!scrapedRecipe?.name,
				ingredients: scrapedRecipe?.ingredients?.length ?? 0
			})
			return jsonResponse({ ...scrapedRecipe, _source: 'scraper', _status: 'complete' }, 200)
		}

		console.warn(`[scrape:${reqId}] Regular scrape incomplete`, {
			ms: Date.now() - startedAt,
			hasName: !!scrapedRecipe?.name,
			ingredients: scrapedRecipe?.ingredients?.length ?? 0
		})
	} catch (err) {
		scrapeError = err instanceof Error ? err : new Error(String(err))
		html = typeof err?.html === 'string' ? err.html : html
		console.error(`[scrape:${reqId}] Regular scrape failed:`, err)
	}

	// AI fallback
	let aiSkipReason = null
	if (html) {
		try {
			const aiConfig = resolveAIConfig(locals, 'text')
			if (!aiConfig.ok) {
				aiSkipReason = 'AI not configured or disabled'
				console.log(`[scrape:${reqId}] AI fallback skipped: ${aiSkipReason}`)
			} else {
				console.log(`[scrape:${reqId}] Attempting AI scrape`, { provider: aiConfig.provider })
				const aiRecipe = await extractRecipeWithLLM({
					provider: aiConfig.provider,
					model: aiConfig.model || undefined,
					type: 'html',
					content: html,
					url
				})
				if (
					aiRecipe &&
					typeof aiRecipe === 'object' &&
					aiRecipe.name &&
					aiRecipe.ingredients?.length > 0
				) {
					console.log(`[scrape:${reqId}] AI scrape success`, {
						ms: Date.now() - startedAt,
						provider: aiConfig.provider,
						ingredients: aiRecipe.ingredients?.length ?? 0
					})
					return jsonResponse({ ...aiRecipe, _source: 'AI', _status: 'complete' }, 200)
				} else {
					aiSkipReason = 'AI returned incomplete data'
					console.warn(`[scrape:${reqId}] AI scrape incomplete`, {
						ms: Date.now() - startedAt,
						hasName: !!aiRecipe?.name,
						ingredients: aiRecipe?.ingredients?.length ?? 0
					})
				}
			}
		} catch (aiErr) {
			aiSkipReason = aiErr instanceof Error ? aiErr.message : String(aiErr)
			console.warn(`[scrape:${reqId}] AI scrape failed: ${aiSkipReason}`)
		}
	} else {
		aiSkipReason = 'no HTML content available'
	}

	// Return partial scrape if possible
	if (isRecipeObject(scrapedRecipe) && hasRecipeFields(scrapedRecipe)) {
		console.log(`[scrape:${reqId}] Returning partial scrape`, {
			ms: Date.now() - startedAt,
			hasName: !!scrapedRecipe?.name,
			ingredients: scrapedRecipe?.ingredients?.length ?? 0,
			aiSkipReason
		})
		return jsonResponse({ ...scrapedRecipe, _source: 'scraper', _status: 'partial' }, 200)
	}

	// Total fail
	console.error(`[scrape:${reqId}] Total failure - no data extracted`, {
		ms: Date.now() - startedAt,
		aiSkipReason,
		scrapeError: scrapeError?.message
	})
	const status = scrapeError?.message?.includes('Upstream site returned HTTP') ? 502 : 500
	return jsonResponse(
		{ message: scrapeError?.message || 'Could not scrape the recipe.' },
		status
	)
}

function jsonResponse(data, status) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' }
	})
}

function isRecipeObject(value) {
	return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function hasRecipeFields(recipe) {
	return Boolean(recipe?.name || recipe?.ingredients?.length || recipe?.instructions?.length)
}
