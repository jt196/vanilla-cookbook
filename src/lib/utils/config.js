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
