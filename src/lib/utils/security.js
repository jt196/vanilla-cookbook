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
