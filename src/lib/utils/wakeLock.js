import { browser } from '$app/environment'

let wakeLock = null

/**
 * Requests a Wake Lock from the browser, which keeps the screen awake while the document is visible.
 * If the Wake Lock API is not supported, logs a warning to the console.
 *
 * @returns {Promise<void>}
 */
export async function requestWakeLock() {
	if (!browser) return

	try {
		if ('wakeLock' in navigator) {
			wakeLock = await navigator.wakeLock.request('screen')
			console.log('✅ Wake Lock: Screen will stay awake.')
			wakeLock.addEventListener('release', () => {
				console.log('❌ Wake Lock released.')
			})
		} else {
			console.warn('⚠️ Wake Lock API not supported in this browser.')
		}
	} catch (err) {
		console.error(`Wake Lock error: ${err.name}, ${err.message}`)
	}
}

/**
 * Releases the Wake Lock if it is currently held, allowing the screen to turn off.
 * Logs a message to the console when the Wake Lock is released.
 * If the Wake Lock is not held or the environment is not a browser, the function returns immediately.
 *
 * @returns {Promise<void>}
 */
export async function releaseWakeLock() {
	if (!browser) return

	if (wakeLock) {
		await wakeLock.release()
		wakeLock = null
		console.log('❌ Wake Lock released.')
	}
}

/**
 * Handles changes in the document's visibility state.
 * Requests a Wake Lock when the document becomes visible,
 * and releases it when the document is hidden.
 * Logs the current visibility state to the console.
 */
export function handleVisibilityChange() {
	if (!browser) return

	if (document.visibilityState === 'visible') {
		console.log('🟢 Page is visible. Requesting Wake Lock...')
		requestWakeLock()
	} else {
		console.log('🔴 Page is hidden. Releasing Wake Lock...')
		releaseWakeLock()
	}
}

/**
 * Sets up the Wake Lock.
 * If the environment is not a browser, the function returns immediately.
 * Requests a Wake Lock and listens for visibility changes on the document.
 * Logs a message to the console when the function is called.
 */
export function setupWakeLock() {
	if (!browser) return

	console.log('🚀 Setting up Wake Lock...')
	requestWakeLock()
	document.addEventListener('visibilitychange', handleVisibilityChange)
}

/**
 * Releases the Wake Lock and removes the event listener for visibility changes on the document.
 * This function is called when the Svelte app is being torn down, to release any held resources.
 * If the environment is not a browser, the function returns immediately.
 */
export function cleanupWakeLock() {
	if (!browser) return

	console.log('🧹 Cleaning up Wake Lock...')
	releaseWakeLock()
	document.removeEventListener('visibilitychange', handleVisibilityChange)
}
