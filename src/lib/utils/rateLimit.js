// HMR-safe in-memory store (persists until the Node process restarts)
const RL_STORE = (globalThis.__rateLimitStore ??= new Map())

/**
 * Fixed-window rate limit check.
 * @param {string} key
 * @param {{limit?: number, windowMs?: number}} [opts]
 * @returns {{ok: boolean, remaining: number, resetMs: number}}
 */
export function rateLimitCheck(key, { limit = 5, windowMs = 60_000 } = {}) {
	const now = Date.now()
	const bucketStart = Math.floor(now / windowMs) * windowMs
	const bucketKey = `${key}:${bucketStart}`

	let item = RL_STORE.get(bucketKey)
	if (!item) {
		item = { count: 0, exp: bucketStart + windowMs }
		RL_STORE.set(bucketKey, item)
	}
	item.count++

	// occasional cleanup of expired buckets
	if ((item.count & 15) === 1) {
		for (const [k, v] of RL_STORE) if (v.exp <= now) RL_STORE.delete(k)
	}

	const remaining = Math.max(0, limit - item.count)
	const resetMs = Math.max(0, item.exp - now)
	return { ok: item.count <= limit, remaining, resetMs }
}

/**
 * Best-effort client IP extraction.
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @returns {string}
 */
export function getClientIp(event) {
	const h = event.request.headers
	const xff = h.get('x-forwarded-for')
	if (xff) return xff.split(',')[0].trim()
	const xri = h.get('x-real-ip')
	if (xri) return xri
	try {
		if (typeof event.getClientAddress === 'function') return event.getClientAddress()
	} catch {}
	return 'unknown'
}

/**
 * Build a convenience limiter API using env (or defaults).
 * @param {{ RATE_LIMIT_WINDOW_MS?: string, RATE_LIMIT_LOGIN_PER_IP?: string, RATE_LIMIT_LOGIN_PER_ID?: string }} envLike
 */
export function makeLimiter(envLike = {}) {
	const windowMs = Number(envLike.RATE_LIMIT_WINDOW_MS) || 60_000
	const loginPerIp = Number(envLike.RATE_LIMIT_LOGIN_PER_IP) || 10
	const loginPerId = Number(envLike.RATE_LIMIT_LOGIN_PER_ID) || 5
	return {
		check: (bucketKey, opts = {}) => rateLimitCheck(bucketKey, { windowMs, ...opts }),
		loginByIp: (ip) => rateLimitCheck(`login:ip:${ip}`, { limit: loginPerIp, windowMs }),
		loginById: (identifier) =>
			rateLimitCheck(`login:id:${identifier}`, { limit: loginPerId, windowMs })
	}
}
