import { YoutubeTranscript } from 'youtube-transcript'

const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player'
// YouTube's own public web player key — not user-specific, no .env needed.
// If YouTube rotates it the InnerTube path will fail gracefully and fall back to page HTML parsing.
const INNERTUBE_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'
const YT_HEADERS = {
	'user-agent':
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
	'accept-language': 'en-US,en;q=0.9'
}

/**
 * @param {string} url
 * @returns {boolean}
 */
export function isYouTubeUrl(url) {
	try {
		const { hostname } = new URL(url)
		return hostname === 'www.youtube.com' || hostname === 'youtube.com' || hostname === 'youtu.be'
	} catch {
		return false
	}
}

/**
 * @param {string} url
 * @returns {{ platform: 'instagram' | 'tiktok' } | false}
 */
export function isBlockedVideoUrl(url) {
	try {
		const { hostname } = new URL(url)
		if (hostname === 'www.instagram.com' || hostname === 'instagram.com') {
			return { platform: 'instagram' }
		}
		if (
			hostname === 'www.tiktok.com' ||
			hostname === 'tiktok.com' ||
			hostname.endsWith('.tiktok.com')
		) {
			return { platform: 'tiktok' }
		}
		return false
	} catch {
		return false
	}
}

/**
 * Handles /watch?v=, /shorts/, and youtu.be/ URL formats.
 *
 * @param {string} url
 * @returns {string | null}
 */
export function extractYouTubeVideoId(url) {
	try {
		const parsed = new URL(url)
		if (parsed.hostname === 'youtu.be') return parsed.pathname.slice(1)
		if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2]
		return parsed.searchParams.get('v')
	} catch {
		return null
	}
}

/**
 * Fetches title and description for a YouTube video.
 * Primary: InnerTube API. Fallback: page HTML regex.
 *
 * @param {string} videoId
 * @returns {Promise<{ title: string, description: string, channelName: string, thumbnailUrl: string } | null>}
 */
export async function fetchYouTubeDescription(videoId) {
	// Primary: InnerTube API (no API key required beyond the public key)
	try {
		const res = await fetch(`${INNERTUBE_URL}?key=${INNERTUBE_KEY}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				context: {
					client: { clientName: 'WEB', clientVersion: '2.20240101.00.00', hl: 'en', gl: 'US' }
				},
				videoId
			})
		})
		if (res.ok) {
			const data = await res.json()
			const vd = data.videoDetails
			if (vd?.title && vd?.shortDescription !== undefined) {
				return {
					title: vd.title,
					description: vd.shortDescription || '',
					channelName: vd.author || '',
					thumbnailUrl: vd.thumbnail?.thumbnails?.at(-1)?.url || ''
				}
			}
		}
	} catch (err) {
		console.warn('[videoHelpers] InnerTube fetch failed, falling back to page HTML:', err.message)
	}

	// Fallback: page HTML regex on ytInitialPlayerResponse
	try {
		const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
			headers: YT_HEADERS
		})
		const html = await pageRes.text()
		const descMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/)
		if (!descMatch) return null

		const titleMatch = html.match(/"title":\{"simpleText":"((?:[^"\\]|\\.)*)"/)
		const authorMatch = html.match(/"ownerChannelName":"((?:[^"\\]|\\.)*)"/)

		return {
			title: titleMatch?.[1]?.replace(/\\n/g, '\n') || '',
			description: descMatch[1].replace(/\\n/g, '\n'),
			channelName: authorMatch?.[1] || '',
			thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
		}
	} catch (err) {
		console.warn('[videoHelpers] Page HTML fallback failed:', err.message)
		return null
	}
}

/**
 * Extracts all https:// URLs from a block of text.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function extractUrlsFromText(text) {
	const urlRegex = /https?:\/\/[^\s"'<>\]\\]+/g
	return [...new Set(text.match(urlRegex) || [])]
}

/**
 * Fetches a cleaned transcript string for a YouTube video.
 * Uses the youtube-transcript package which handles YouTube's session validation.
 *
 * @param {string} videoId
 * @returns {Promise<string | null>}
 */
export async function fetchYouTubeTranscript(videoId) {
	try {
		const entries = await YoutubeTranscript.fetchTranscript(videoId)
		if (!entries?.length) return null
		return entries
			.map((e) => e.text)
			.join(' ')
			.replace(/\s+/g, ' ')
			.trim()
	} catch (err) {
		console.warn('[videoHelpers] Transcript fetch failed:', err.message)
		return null
	}
}
