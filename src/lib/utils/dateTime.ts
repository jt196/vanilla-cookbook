// Accepts date objects or strings
export function localDateAndTime(dateTime: string | Date | null) {
	if (!dateTime) return ''
	const myDate = typeof dateTime === 'string' ? new Date(dateTime) : dateTime
	const localDate = myDate.toLocaleDateString()
	const localTime = myDate.toLocaleTimeString()
	return localDate + ' ' + localTime
}

// Returns the current datetime in ISO 8601 format
export function getIsoDateTimeString(): string {
	const now = new Date()
	return now.toISOString()
}

// Parse a string and convert it to ISO format
export function stringToISOString(dateString: string): string {
	const dt = new Date(dateString)
	return dt.toISOString()
}

// Convert text input to minutes
export function convertToMinutes(input: string): number | null {
	const regex = /(?:(\d+)\s*(hrs?|hours?|h))?\s*(?:(\d+)\s*(mins?|minutes?|m))?/i

	const matches = input.match(regex)

	if (matches) {
		const hours = parseInt(matches[1] || '0', 10)
		const minutes = parseInt(matches[3] || '0', 10)

		return hours * 60 + minutes
	}

	return null
}

// Convert minutes number into readable string
export function convertMinutesToTime(minutes: number): string {
	if (minutes < 60) {
		return `${minutes} minutes`
	} else {
		const hours = Math.floor(minutes / 60)
		const remainingMinutes = minutes % 60
		return `${hours}hr ${remainingMinutes} minutes`
	}
}
