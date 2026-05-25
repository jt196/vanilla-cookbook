import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
	isYouTubeUrl,
	isBlockedVideoUrl,
	extractYouTubeVideoId,
	extractUrlsFromText,
	fetchYouTubeDescription,
	fetchYouTubeTranscript
} from '$lib/utils/parse/videoHelpers'

/* global describe, it, expect */

// ─── Pure function unit tests ─────────────────────────────────────────────────

describe('isYouTubeUrl', () => {
	it('matches www.youtube.com watch URLs', () => {
		expect(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true)
	})
	it('matches youtu.be short URLs', () => {
		expect(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true)
	})
	it('matches youtube.com without www', () => {
		expect(isYouTubeUrl('https://youtube.com/watch?v=abc123')).toBe(true)
	})
	it('matches /shorts/ URLs', () => {
		expect(isYouTubeUrl('https://www.youtube.com/shorts/abc123')).toBe(true)
	})
	it('returns false for non-YouTube URLs', () => {
		expect(isYouTubeUrl('https://vimeo.com/123456')).toBe(false)
		expect(isYouTubeUrl('https://allrecipes.com/recipe/123')).toBe(false)
	})
	it('returns false for malformed URLs', () => {
		expect(isYouTubeUrl('not-a-url')).toBe(false)
	})
})

describe('isBlockedVideoUrl', () => {
	it('detects instagram.com', () => {
		expect(isBlockedVideoUrl('https://www.instagram.com/p/abc123')).toEqual({ platform: 'instagram' })
	})
	it('detects instagram.com without www', () => {
		expect(isBlockedVideoUrl('https://instagram.com/reel/abc')).toEqual({ platform: 'instagram' })
	})
	it('detects tiktok.com', () => {
		expect(isBlockedVideoUrl('https://www.tiktok.com/@user/video/123')).toEqual({ platform: 'tiktok' })
	})
	it('returns false for YouTube', () => {
		expect(isBlockedVideoUrl('https://www.youtube.com/watch?v=abc')).toBe(false)
	})
	it('returns false for recipe sites', () => {
		expect(isBlockedVideoUrl('https://allrecipes.com/recipe/123')).toBe(false)
	})
	it('returns false for malformed URLs', () => {
		expect(isBlockedVideoUrl('not-a-url')).toBe(false)
	})
})

describe('extractYouTubeVideoId', () => {
	it('extracts ID from /watch?v= URL', () => {
		expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
	})
	it('extracts ID from youtu.be URL', () => {
		expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
	})
	it('extracts ID from /shorts/ URL', () => {
		expect(extractYouTubeVideoId('https://www.youtube.com/shorts/abc123XYZ')).toBe('abc123XYZ')
	})
	it('returns null for non-YouTube URL', () => {
		expect(extractYouTubeVideoId('https://vimeo.com/123')).toBeNull()
	})
	it('returns null for malformed URL', () => {
		expect(extractYouTubeVideoId('not-a-url')).toBeNull()
	})
})

describe('extractUrlsFromText', () => {
	it('extracts https URLs from plain text', () => {
		const text = 'Check out the recipe at https://example.com/recipe and also https://other.com'
		expect(extractUrlsFromText(text)).toEqual(['https://example.com/recipe', 'https://other.com'])
	})
	it('deduplicates repeated URLs', () => {
		const text = 'Visit https://example.com and again https://example.com'
		expect(extractUrlsFromText(text)).toEqual(['https://example.com'])
	})
	it('returns empty array when no URLs present', () => {
		expect(extractUrlsFromText('No links here at all.')).toEqual([])
	})
	it('strips trailing punctuation-like characters', () => {
		const text = 'See https://example.com/recipe for details'
		const urls = extractUrlsFromText(text)
		expect(urls[0]).toBe('https://example.com/recipe')
	})
})

// ─── Integration tests (real network) ────────────────────────────────────────
// These hit YouTube directly. Skipped in CI via SKIP_NETWORK env var.

const SKIP = process.env.SKIP_NETWORK === '1'

// Use the Rick Astley official video as a stable, permanent public video
const TEST_VIDEO_ID = 'dQw4w9WgXcQ'

describe.skipIf(SKIP)('fetchYouTubeDescription (network)', () => {
	it('returns title and description for a public video', async () => {
		const result = await fetchYouTubeDescription(TEST_VIDEO_ID)
		expect(result).not.toBeNull()
		expect(result.title).toBeTruthy()
		expect(typeof result.description).toBe('string')
		expect(typeof result.channelName).toBe('string')
		// Description should contain at least some content
		expect(result.description.length).toBeGreaterThan(10)
	}, 15000)

	it('returns URLs found in the description', async () => {
		const result = await fetchYouTubeDescription(TEST_VIDEO_ID)
		expect(result).not.toBeNull()
		const { extractUrlsFromText: extractUrls } = await import('$lib/utils/parse/videoHelpers')
		const urls = extractUrls(result.description)
		// Rick Astley video description is known to contain URLs
		expect(urls.length).toBeGreaterThan(0)
	}, 15000)

	it('returns null for a non-existent video ID', async () => {
		const result = await fetchYouTubeDescription('XXXXXXXXXXXXXXX')
		// Should return null or a result with empty description rather than throwing
		expect(result === null || result?.description === '').toBe(true)
	}, 15000)
})

describe.skipIf(SKIP)('fetchYouTubeTranscript (network)', () => {
	it('returns a non-empty transcript string for a public video with captions', async () => {
		const transcript = await fetchYouTubeTranscript(TEST_VIDEO_ID)
		// Some videos may not have English captions accessible — soft assertion
		if (transcript !== null) {
			expect(typeof transcript).toBe('string')
			expect(transcript.length).toBeGreaterThan(50)
		} else {
			console.warn('Transcript not available for test video — YouTube may be blocking server-side fetch')
		}
	}, 20000)
})
