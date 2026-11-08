/**
 * Mark a partial object as a test double for a type it doesn't fully satisfy, e.g. a
 * `{ params, locals }` object passed to a route handler that expects a full SvelteKit
 * RequestEvent. It returns the value unchanged.
 *
 * @param {unknown} value
 * @returns {any}
 */
export const fake = (value) => value
