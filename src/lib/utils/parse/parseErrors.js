/**
 * An object containing custom error messages related to recipe parsing.
 *
 * @type {Object}
 * @property {Error} NO_JSON_LD - Error indicating no JSON-LD was found in the HTML.
 * @property {Error} MISSING_DATA - Error indicating missing data in the parsed recipe.
 * @property {Error} PARSING_ERROR - Error indicating a general parsing error.
 */
export const ERRORS = {
	NO_JSON_LD: new Error('No JSON-LD found'),
	MISSING_DATA: new Error('Missing data'),
	PARSING_ERROR: new Error('Error parsing recipe')
}
