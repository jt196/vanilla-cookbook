/**
 * Validates a password to ensure it meets the security requirements.
 *
 * @param {string} password - The password to validate.
 * @returns {{ isValid: boolean, message: string }} An object indicating whether the password is valid and a message explaining the validation result.
 *
 * The password must satisfy the following conditions:
 * - Be at least 8 characters long
 * - Contain at least one uppercase letter
 * - Contain at least one lowercase letter
 * - Contain at least one number
 * - Contain at least one special character
 */
export function validatePassword(password) {
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
