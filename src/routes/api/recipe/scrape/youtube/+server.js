import { extractRecipeFromVideoText } from '$lib/utils/ai'
import { resolveAIConfig } from '$lib/server/aiHelpers'
import {
	extractYouTubeVideoId,
	fetchYouTubeDescription,
	extractUrlsFromText,
	fetchYouTubeTranscript
} from '$lib/utils/parse/videoHelpers'
import { parseURL } from '$lib/utils/parse/recipeParse'

function jsonResponse(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json' }
	})
}

function hasRecipe(recipe) {
	return recipe && typeof recipe === 'object' && recipe.name && recipe.ingredients?.length > 0
}

export async function POST({ request, locals }) {
	let body
	try {
		body = await request.json()
	} catch {
		return jsonResponse({ error: 'Invalid request body.' }, 400)
	}

	const { stage, url, language = 'eng' } = body
	if (!url) return jsonResponse({ error: 'Missing url.' }, 400)

	const videoId = extractYouTubeVideoId(url)
	if (!videoId) {
		return jsonResponse({ error: 'Could not extract YouTube video ID from URL.' }, 400)
	}

	if (stage === 'links') return handleLinksStage(videoId)
	if (stage === 'description') return handleDescriptionStage(videoId, url, locals, language)
	if (stage === 'transcript') return handleTranscriptStage(videoId, locals, language)

	return jsonResponse({ error: 'Invalid stage. Use "links", "description", or "transcript".' }, 400)
}

async function handleLinksStage(videoId) {
	const reqId = crypto.randomUUID().slice(0, 8)
	console.log(`[yt:${reqId}] links stage`, { videoId })

	const videoData = await fetchYouTubeDescription(videoId)
	if (!videoData) {
		console.log(`[yt:${reqId}] no video data found`)
		return jsonResponse({ _noRecipe: true })
	}

	const urls = extractUrlsFromText(videoData.description)
	console.log(`[yt:${reqId}] found ${urls.length} URL(s) in description`)

	for (const linkedUrl of urls) {
		if (isNonRecipeUrl(linkedUrl)) continue
		try {
			const result = await parseURL(linkedUrl)
			const recipe = result.parsedHTML
			if (hasRecipe(recipe)) {
				console.log(`[yt:${reqId}] recipe found via linked page: ${linkedUrl}`)
				return jsonResponse({
					...recipe,
					sourceUrl: linkedUrl,
					_source: 'YouTube (linked recipe)',
					_status: 'complete'
				})
			}
		} catch {
			// try next URL
		}
	}

	console.log(`[yt:${reqId}] no recipe found in linked pages`)
	return jsonResponse({ _noRecipe: true })
}

async function handleDescriptionStage(videoId, url, locals, language = 'eng') {
	const reqId = crypto.randomUUID().slice(0, 8)
	console.log(`[yt:${reqId}] description stage`, { videoId })

	const aiConfig = resolveAIConfig(locals, 'text')
	if (!aiConfig.ok) {
		return jsonResponse({ code: 'recipeNew.msg.youtubeNoAi', _noAi: true }, 422)
	}

	const videoData = await fetchYouTubeDescription(videoId)
	if (!videoData?.description) {
		console.log(`[yt:${reqId}] no description found`)
		return jsonResponse({ _noRecipe: true })
	}

	const content = [videoData.title, videoData.description].filter(Boolean).join('\n\n')
	const recipe = await extractRecipeFromVideoText({
		provider: aiConfig.provider,
		model: aiConfig.model || undefined,
		content,
		url,
		language
	})

	if (recipe?._noRecipe || !recipe?.name) {
		console.log(`[yt:${reqId}] no recipe found in description`)
		return jsonResponse({ _noRecipe: true })
	}

	console.log(`[yt:${reqId}] recipe extracted from description`)
	return jsonResponse({
		...recipe,
		_source: 'YouTube (description)',
		_status: hasRecipe(recipe) ? 'complete' : 'partial'
	})
}

async function handleTranscriptStage(videoId, locals, language = 'eng') {
	const reqId = crypto.randomUUID().slice(0, 8)
	console.log(`[yt:${reqId}] transcript stage`, { videoId })

	const aiConfig = resolveAIConfig(locals, 'text')
	if (!aiConfig.ok) {
		return jsonResponse({ code: 'recipeNew.msg.youtubeNoAi', _noAi: true }, 422)
	}

	const transcript = await fetchYouTubeTranscript(videoId)
	if (!transcript) {
		console.log(`[yt:${reqId}] no transcript available`)
		return jsonResponse({ _noRecipe: true })
	}

	console.log(`[yt:${reqId}] transcript fetched (${transcript.length} chars), parsing with AI`)
	const recipe = await extractRecipeFromVideoText({
		provider: aiConfig.provider,
		model: aiConfig.model || undefined,
		content: transcript,
		language
	})

	if (recipe?._noRecipe || !recipe?.name) {
		console.log(`[yt:${reqId}] no recipe found in transcript`)
		return jsonResponse({ _noRecipe: true })
	}

	console.log(`[yt:${reqId}] recipe extracted from transcript`)
	return jsonResponse({
		...recipe,
		_source: 'YouTube (transcript)',
		_status: hasRecipe(recipe) ? 'complete' : 'partial'
	})
}

/** Heuristic: skip URLs that are unlikely to be recipe pages. */
function isNonRecipeUrl(url) {
	try {
		const { hostname } = new URL(url)
		const skip = [
			'youtube.com', 'youtu.be', 'twitter.com', 'x.com', 'instagram.com',
			'tiktok.com', 'facebook.com', 'patreon.com', 'ko-fi.com', 'linktr.ee',
			'amzn.to', 'amazon.com', 'apple.com', 'spotify.com', 'bit.ly', 'ow.ly'
		]
		return skip.some((d) => hostname === d || hostname.endsWith('.' + d))
	} catch {
		return true
	}
}
