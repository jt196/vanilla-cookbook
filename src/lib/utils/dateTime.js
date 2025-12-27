/**
 * Accepts date objects or strings and returns a string in local date and time format.
 * @param {(string|Date|null)} dateTime - A date object, date string, or null.
 * @returns {string} - The local date and time in string format.
 */
export function localDateAndTime(dateTime) {
	if (!dateTime) return ''
	const myDate = typeof dateTime === 'string' ? new Date(dateTime) : dateTime
	const localDate = myDate.toLocaleDateString()
	const localTime = myDate.toLocaleTimeString()
	return localDate + ' ' + localTime
}

/**
 * Takes a dateTime parameter and returns the local date.
 *
 * @param {any} dateTime - the date and time input
 * @return {string} the local date
 */
export function localDate(dateTime) {
	if (!dateTime) return ''
	const myDate = typeof dateTime === 'string' ? new Date(dateTime) : dateTime
	const localDate = myDate.toLocaleDateString()
	return localDate
}

/**
 * Returns the current datetime in ISO 8601 format.
 * @returns {string} - The current datetime in ISO 8601 format.
 */
export function getIsoDateTimeString() {
	const now = new Date()
	return now.toISOString()
}

/**
 * Parse a date string and convert it to ISO format.
 * @param {string} dateString - The date string to be parsed.
 * @returns {string} - The ISO format of the parsed date string.
 */
export function stringToISOString(dateString) {
	const dt = new Date(dateString)
	return dt.toISOString()
}

/**
 * Convert a text input into minutes.
 * @param {string} input - The input string containing duration in text format.
 * @returns {(number|null)} - The total number of minutes represented by the input string, or null if parsing failed.
 */
export function convertToMinutes(input) {
	const regex = /(?:(\d+)\s*(hrs?|hours?|h))?\s*(?:(\d+)\s*(mins?|minutes?|m))?/i
	const matches = input.match(regex)
	if (matches && (matches[1] || matches[3])) {
		const hours = parseInt(matches[1] || '0', 10)
		const minutes = parseInt(matches[3] || '0', 10)
		return hours * 60 + minutes
	}
	return null
}

/**
 * Convert a number of minutes into a readable string.
 * @param {number} minutes - The total number of minutes.
 * @returns {string} - The duration in a readable string format.
 */
export function convertMinutesToTime(minutes) {
	if (minutes < 60) {
		return `${minutes} minutes`
	} else {
		const hours = Math.floor(minutes / 60)
		const remainingMinutes = minutes % 60
		return `${hours}hr ${remainingMinutes} minutes`
	}
}

/**
 * Convert a cron schedule string to plain English.
 * @param {string} cronString - The cron schedule string (e.g., "0 3 * * 0")
 * @returns {string} - A human-readable description of the schedule
 */
export function cronToPlainEnglish(cronString) {
	if (!cronString) return 'Not configured'

	const parts = cronString.trim().split(/\s+/)
	if (parts.length !== 5) return cronString // Return as-is if invalid format

	const [minute, hour, dayOfMonth, month, dayOfWeek] = parts

	// Helper to format time
	const formatTime = (h, m) => {
		const hour12 = h === '0' ? 12 : h > 12 ? h - 12 : h
		const ampm = h < 12 ? 'AM' : 'PM'
		const minuteStr = m === '0' ? '00' : m.padStart(2, '0')
		return `${hour12}:${minuteStr} ${ampm}`
	}

	const time = formatTime(hour, minute)

	// Check for specific patterns
	if (dayOfMonth !== '*' && month !== '*') {
		// Specific date
		return `On day ${dayOfMonth} of month ${month} at ${time}`
	}

	if (dayOfMonth !== '*' && month === '*') {
		// Monthly on specific day
		const suffix = dayOfMonth === '1' ? 'st' : dayOfMonth === '2' ? 'nd' : dayOfMonth === '3' ? 'rd' : 'th'
		return `Monthly on the ${dayOfMonth}${suffix} at ${time}`
	}

	if (dayOfWeek !== '*') {
		// Weekly schedule
		const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
		const dayName = days[parseInt(dayOfWeek)] || `day ${dayOfWeek}`
		return `Every ${dayName} at ${time}`
	}

	// Check for interval patterns
	if (hour.includes('/')) {
		const interval = hour.split('/')[1]
		return `Every ${interval} hours`
	}

	if (minute.includes('/')) {
		const interval = minute.split('/')[1]
		return `Every ${interval} minutes`
	}

	// Daily
	if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
		return `Daily at ${time}`
	}

	return cronString // Fallback to original string
}
