/**
 * Helper to parse environment boolean values.
 * @param {string|undefined} value - Environment variable value
 * @param {boolean} defaultValue - Default if not set
 * @returns {boolean}
 */
function envBool(value, defaultValue) {
	if (value === undefined || value === '') return defaultValue
	return /^(true|1|yes|on)$/i.test(value.trim())
}

/**
 * Default password requirements (used when env vars not available).
 * @type {{ minLength: number, requireUppercase: boolean, requireLowercase: boolean, requireDigit: boolean, requireSpecial: boolean }}
 */
const DEFAULT_REQUIREMENTS = {
	minLength: 8,
	requireUppercase: true,
	requireLowercase: true,
	requireDigit: true,
	requireSpecial: true
}

/**
 * Gets the current password requirements from environment variables.
 *
 * Environment variables:
 * - PASSWORD_MIN_LENGTH: Minimum password length (default: 8)
 * - PASSWORD_REQUIRE_UPPERCASE: Require uppercase letters (default: true)
 * - PASSWORD_REQUIRE_LOWERCASE: Require lowercase letters (default: true)
 * - PASSWORD_REQUIRE_DIGIT: Require digits (default: true)
 * - PASSWORD_REQUIRE_SPECIAL: Require special characters (default: true)
 *
 * @param {Record<string, string>} [env] - Environment object (for server-side use)
 * @returns {{ minLength: number, requireUppercase: boolean, requireLowercase: boolean, requireDigit: boolean, requireSpecial: boolean }}
 *
 * @example
 * // Server-side (in +server.js or +page.server.js)
 * import { env } from '$env/dynamic/private'
 * const reqs = getPasswordRequirements(env)
 *
 * // Client-side (uses defaults, or call API to get server requirements)
 * const reqs = getPasswordRequirements()
 */
export function getPasswordRequirements(env = {}) {
	return {
		minLength: Number(env.PASSWORD_MIN_LENGTH) || DEFAULT_REQUIREMENTS.minLength,
		requireUppercase: envBool(
			env.PASSWORD_REQUIRE_UPPERCASE,
			DEFAULT_REQUIREMENTS.requireUppercase
		),
		requireLowercase: envBool(
			env.PASSWORD_REQUIRE_LOWERCASE,
			DEFAULT_REQUIREMENTS.requireLowercase
		),
		requireDigit: envBool(env.PASSWORD_REQUIRE_DIGIT, DEFAULT_REQUIREMENTS.requireDigit),
		requireSpecial: envBool(env.PASSWORD_REQUIRE_SPECIAL, DEFAULT_REQUIREMENTS.requireSpecial)
	}
}

/**
 * Gets a human-readable description of password requirements.
 *
 * @param {Record<string, string>} [env] - Environment object (for server-side use)
 * @returns {string} Human-readable requirements description
 *
 * @example
 * const desc = getPasswordRequirementsDescription()
 * // "Password must be at least 8 characters, include uppercase, lowercase, digit, and special character."
 */
export function getPasswordRequirementsDescription(env = {}) {
	const reqs = getPasswordRequirements(env)
	const parts = [`at least ${reqs.minLength} characters`]

	if (reqs.requireUppercase) parts.push('uppercase letter')
	if (reqs.requireLowercase) parts.push('lowercase letter')
	if (reqs.requireDigit) parts.push('digit')
	if (reqs.requireSpecial) parts.push('special character')

	if (parts.length === 1) {
		return `Password must be ${parts[0]}.`
	}

	const last = parts.pop()
	return `Password must be ${parts.join(', ')}, and ${last}.`
}

/**
 * Validates a password to ensure it meets the security requirements.
 *
 * Requirements are configurable via environment variables:
 * - PASSWORD_MIN_LENGTH: Minimum password length (default: 8)
 * - PASSWORD_REQUIRE_UPPERCASE: Require uppercase letters (default: true)
 * - PASSWORD_REQUIRE_LOWERCASE: Require lowercase letters (default: true)
 * - PASSWORD_REQUIRE_DIGIT: Require digits (default: true)
 * - PASSWORD_REQUIRE_SPECIAL: Require special characters (default: true)
 *
 * @param {string} password - The password to validate.
 * @param {Record<string, string>} [env] - Environment object (for server-side use)
 * @returns {{ isValid: boolean, message: string }} An object indicating whether the password is valid and a message explaining the validation result.
 *
 * @example
 * // Client-side (uses defaults)
 * const { isValid, message } = validatePassword('MyP@ssw0rd')
 *
 * // Server-side (uses env config)
 * import { env } from '$env/dynamic/private'
 * const { isValid, message } = validatePassword('MyP@ssw0rd', env)
 */
export function validatePassword(password, env = {}) {
	if (!password || typeof password !== 'string')
		return { isValid: false, message: 'Password is required.' }

	const reqs = getPasswordRequirements(env)

	if (password.length < reqs.minLength)
		return {
			isValid: false,
			message: `Password should be at least ${reqs.minLength} characters long.`
		}
	if (reqs.requireUppercase && !/[A-Z]/.test(password))
		return { isValid: false, message: 'Password should contain at least one uppercase letter.' }
	if (reqs.requireLowercase && !/[a-z]/.test(password))
		return { isValid: false, message: 'Password should contain at least one lowercase letter.' }
	if (reqs.requireDigit && !/[0-9]/.test(password))
		return { isValid: false, message: 'Password should contain at least one number.' }
	if (reqs.requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password))
		return { isValid: false, message: 'Password should contain at least one special character.' }
	return { isValid: true, message: 'Password looks good!' }
}

/**
 * Validates a password and confirmation together, returning a single message and validity flag.
 *
 * Rules:
 * 1. If confirmPassword is empty => message "Confirm Password", isValid=false
 * 2. If passwords don't match => message "Passwords don't match!", isValid=false
 * 3. If passwords match but criteria fail => message from validatePassword, isValid=false
 * 4. If passwords match and criteria pass => no message, isValid=true
 *
 * @param {string} password
 * @param {string} confirmPassword
 * @param {Record<string, string>} [env] - Environment object (for server-side use)
 * @returns {{ isValid: boolean, message: string|null }}
 */
export function validatePasswords(password, confirmPassword, env = {}) {
	// Handle missing confirmation
	if (!confirmPassword) {
		return { isValid: false, message: 'Confirm Password' }
	}

	// Validate the base password requirements
	const base = validatePassword(password, env)
	if (!base.isValid) {
		return base
	}

	// Check match
	if (password !== confirmPassword) {
		return { isValid: false, message: "Passwords don't match!" }
	}

	return { isValid: true, message: null }
}

/**
 * Converts password requirements into the env-shape expected by validation helpers.
 *
 * @param {{ minLength: number, requireUppercase: boolean, requireLowercase: boolean, requireDigit: boolean, requireSpecial: boolean } | null | undefined} requirements
 * @returns {Record<string, string>}
 */
export function buildPasswordEnv(requirements) {
	if (!requirements) return {}
	return {
		PASSWORD_MIN_LENGTH: String(requirements.minLength),
		PASSWORD_REQUIRE_UPPERCASE: String(requirements.requireUppercase),
		PASSWORD_REQUIRE_LOWERCASE: String(requirements.requireLowercase),
		PASSWORD_REQUIRE_DIGIT: String(requirements.requireDigit),
		PASSWORD_REQUIRE_SPECIAL: String(requirements.requireSpecial)
	}
}

/**
 * Validates a single email address with a basic regex.
 *
 * @param {string} email
 * @returns {{ isValid: boolean, message: string|null }}
 */
export function validateEmail(email) {
	if (!email) {
		return { isValid: false, message: 'Email is required.' }
	}
	// Simple but effective email regex
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	if (!emailRegex.test(email)) {
		return { isValid: false, message: 'Please enter a valid email address.' }
	}
	return { isValid: true, message: null }
}
