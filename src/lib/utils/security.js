/**
 * Validates a password to ensure it meets the security requirements.
 *
 * @param {string} password - The password to validate.
 * @returns {{ isValid: boolean, message: string }} An object indicating whether the password is valid and a message explaining the validation result.
 *
 * The password must satisfy the following conditions:
 *
 * - Be at least 8 characters long
 * - Contain at least one uppercase letter
 * - Contain at least one lowercase letter
 * - Contain at least one number
 * - Contain at least one special character
 */
export function validatePassword(password) {
	if (!password || typeof password !== 'string')
		return { isValid: false, message: 'Password is required.' }
	if (password.length < 8)
		return { isValid: false, message: 'Password should be at least 8 characters long.' }
	if (!/[A-Z]/.test(password))
		return { isValid: false, message: 'Password should contain at least one uppercase letter.' }
	if (!/[a-z]/.test(password))
		return { isValid: false, message: 'Password should contain at least one lowercase letter.' }
	if (!/[0-9]/.test(password))
		return { isValid: false, message: 'Password should contain at least one number.' }
	if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(password))
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
 * @returns {{ isValid: boolean, message: string|null }}
 */
export function validatePasswords(password, confirmPassword) {
	// Handle missing confirmation
	if (!confirmPassword) {
		return { isValid: false, message: 'Confirm Password' }
	}

	// Validate the base password requirements
	const base = validatePassword(password)
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
