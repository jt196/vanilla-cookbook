/**
 * Supported measurement systems for recipe data.
 * Each system includes a machine-readable value and a user-friendly label.
 *
 * @type {{ value: string, label: string }[]}
 */
export const systems = [
	{ value: 'metric', label: 'Metric' },
	{ value: 'imperial', label: 'Imperial' },
	{ value: 'americanVolumetric', label: 'US Cups' }
]

/**
 * Supported languages for the application.
 * Each language includes a language code and its display label.
 *
 * @type {{ value: string, label: string }[]}
 */
export const languages = [
	{ value: 'eng', label: 'English' },
	{ value: 'deu', label: 'Deutsch' },
	{ value: 'ita', label: 'Italiano' },
	{ value: 'esp', label: 'Español' },
	{ value: 'fra', label: 'Français' },
	{ value: 'por', label: 'Português' },
	{ value: 'rus', label: 'Русский' },
	{ value: 'hin', label: 'हिन्दी' },
	{ value: 'ind', label: 'Bahasa Indonesia' },
	{ value: 'ara', label: 'العربية' }
]

/**
 * Default structure for a recipe object.
 * Used to initialize empty recipe forms or reset state.
 *
 * @type {{
 *  name: string,
 *  source: string,
 *  source_url: string,
 *  cook_time: string,
 *  image_url: string,
 *  prep_time: string,
 *  ingredients: string,
 *  directions: string,
 *  total_time: string,
 *  servings: string,
 *  nutritional_info: string
 * }}
 */
export const defaultRecipe = {
	name: '',
	source: '',
	source_url: '',
	cook_time: '',
	image_url: '',
	prep_time: '',
	ingredients: '',
	directions: '',
	total_time: '',
	servings: '',
	nutritional_info: ''
}

export const ingVersion = 2.36

/**
 * Helper to safely get environment variable (works on both server and client).
 * Returns undefined on client side where process is not available.
 *
 * @param {string} key - Environment variable name
 * @param {string} defaultValue - Default value if env var not set
 * @returns {string} Environment variable value or default
 */
function getEnv(key, defaultValue) {
	// Check if we're in a server environment (Node.js)
	if (typeof process !== 'undefined' && process.env) {
		return process.env[key] || defaultValue
	}
	return defaultValue
}

/**
 * Fuse.js configuration for ingredient matching.
 *
 * These settings control how strictly ingredients are matched against the database.
 * Can be customized via environment variables for fine-tuning matching behavior.
 * Defaults are used on client side where env vars are not available.
 *
 * @type {{
 *   strictThreshold: number,
 *   relaxedThreshold: number,
 *   minWordLength: number,
 *   distance: number,
 *   minMatchCharLength: number
 * }}
 */
export const fuseConfig = {
	// Strict threshold for full ingredient name matching (0.0 = perfect, 1.0 = anything)
	strictThreshold: parseFloat(getEnv('FUSE_THRESHOLD_STRICT', '0.3')),

	// Relaxed threshold for individual word matching in multi-word ingredients
	relaxedThreshold: parseFloat(getEnv('FUSE_THRESHOLD_RELAXED', '0.5')),

	// Minimum word length to attempt matching (skip short words like "of", "in")
	minWordLength: parseInt(getEnv('FUSE_MIN_WORD_LENGTH', '3'), 10),

	// Distance: how far from start can a match be? (lower = closer to start required)
	distance: parseInt(getEnv('FUSE_DISTANCE', '100'), 10),

	// Minimum characters that must match
	minMatchCharLength: parseInt(getEnv('FUSE_MIN_MATCH_CHAR_LENGTH', '2'), 10)
}

/**
 * Returns Fuse.js options object for ingredient matching.
 *
 * @param {boolean} [useRelaxed=false] - Whether to use relaxed threshold (for word-by-word matching)
 * @returns {Object} Fuse.js configuration object
 */
export function getFuseOptions(useRelaxed = false) {
	return {
		keys: ['name'],
		threshold: useRelaxed ? fuseConfig.relaxedThreshold : fuseConfig.strictThreshold,
		distance: fuseConfig.distance,
		minMatchCharLength: fuseConfig.minMatchCharLength,
		includeScore: true,
		caseSensitive: false
	}
}
