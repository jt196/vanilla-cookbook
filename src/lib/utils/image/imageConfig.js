import { env } from '$env/dynamic/private'

/**
 * Shared image sizing configuration for recipe storage, OCR preprocessing, and generation.
 * Values can be overridden in .env with safe fallbacks.
 */
const DEFAULT_MAX_DIMENSION = 1024
const MIN_DIMENSION = 256
const MAX_DIMENSION = 4096

function parseMaxDimension(raw) {
	const parsed = Number.parseInt(raw || '', 10)
	if (!Number.isFinite(parsed)) return DEFAULT_MAX_DIMENSION
	if (parsed < MIN_DIMENSION || parsed > MAX_DIMENSION) return DEFAULT_MAX_DIMENSION
	return parsed
}

function parseGenerationSize(raw, fallbackDimension) {
	const fallback = `${fallbackDimension}x${fallbackDimension}`
	if (!raw || typeof raw !== 'string') return fallback

	const match = raw.trim().match(/^(\d{2,4})x(\d{2,4})$/)
	if (!match) return fallback

	const width = Number.parseInt(match[1], 10)
	const height = Number.parseInt(match[2], 10)
	if (!Number.isFinite(width) || !Number.isFinite(height)) return fallback
	if (
		width < MIN_DIMENSION ||
		width > MAX_DIMENSION ||
		height < MIN_DIMENSION ||
		height > MAX_DIMENSION
	) {
		return fallback
	}

	return `${width}x${height}`
}

export const RECIPE_IMAGE_MAX_DIMENSION = parseMaxDimension(env.RECIPE_IMAGE_MAX_DIMENSION)
export const RECIPE_IMAGE_GENERATION_SIZE = parseGenerationSize(
	env.RECIPE_IMAGE_GENERATION_SIZE,
	RECIPE_IMAGE_MAX_DIMENSION
)
