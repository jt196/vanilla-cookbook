import { browser } from '$app/environment'

let wakeLock = null

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

export async function releaseWakeLock() {
	if (!browser) return

	if (wakeLock) {
		await wakeLock.release()
		wakeLock = null
		console.log('❌ Wake Lock released.')
	}
}

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

export function setupWakeLock() {
	if (!browser) return

	console.log('🚀 Setting up Wake Lock...')
	requestWakeLock()
	document.addEventListener('visibilitychange', handleVisibilityChange)
}

export function cleanupWakeLock() {
	if (!browser) return

	console.log('🧹 Cleaning up Wake Lock...')
	releaseWakeLock()
	document.removeEventListener('visibilitychange', handleVisibilityChange)
}
