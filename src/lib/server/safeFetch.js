/**
 * Fetch for user-supplied URLs (recipe pages, recipe images).
 *
 * Only http(s) URLs whose host resolves to a public address are fetched, and every
 * redirect hop is checked the same way. This keeps the scraper and image downloader
 * pointed at the public web rather than the server's own network.
 *
 * @module safeFetch
 */
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const MAX_REDIRECTS = 5

/** IPv4 ranges that are not publicly routable: [first octets as a prefix, bit length]. */
const BLOCKED_V4 = [
	['0.0.0.0', 8], // "this" network
	['10.0.0.0', 8], // private
	['100.64.0.0', 10], // carrier-grade NAT
	['127.0.0.0', 8], // loopback
	['169.254.0.0', 16], // link-local
	['172.16.0.0', 12], // private
	['192.0.0.0', 24], // IETF protocol assignments
	['192.168.0.0', 16], // private
	['198.18.0.0', 15], // benchmarking
	['224.0.0.0', 3] // multicast + reserved + broadcast (224.0.0.0 – 255.255.255.255)
]

const v4ToInt = (ip) => ip.split('.').reduce((n, octet) => (n << 8) + Number(octet), 0) >>> 0

/**
 * Whether an IP address is private, loopback, link-local or otherwise non-public.
 *
 * @param {string} ip - IPv4 or IPv6 literal
 * @returns {boolean}
 */
export function isPrivateAddress(ip) {
	if (isIP(ip) === 4) {
		const n = v4ToInt(ip)
		return BLOCKED_V4.some(([base, bits]) => {
			const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0
			return (n & mask) === (v4ToInt(base) & mask)
		})
	}

	const v6 = ip.toLowerCase()
	// IPv4-mapped (::ffff:a.b.c.d) is checked as the IPv4 address it maps to
	const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
	if (mapped) return isPrivateAddress(mapped[1])
	return (
		v6 === '::' ||
		v6 === '::1' ||
		/^f[cd]/.test(v6) || // unique local fc00::/7
		/^fe[89ab]/.test(v6) || // link-local fe80::/10
		/^ff/.test(v6) // multicast
	)
}

/**
 * Throw unless `url` is http(s) and its host resolves only to public addresses.
 *
 * @param {string | URL} url
 * @returns {Promise<URL>} The parsed URL
 * @throws {Error} For other protocols, unresolvable hosts or non-public addresses
 */
export async function assertPublicUrl(url) {
	const parsed = new URL(url)
	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		throw new Error(`Only http and https URLs can be fetched (got ${parsed.protocol})`)
	}

	const host = parsed.hostname.replace(/^\[|\]$/g, '')
	const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true })
	if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
		throw new Error(`Refusing to fetch ${parsed.hostname}: not a public address`)
	}
	return parsed
}

/**
 * `fetch` for untrusted URLs: checks the URL and each redirect target with `assertPublicUrl`.
 *
 * @param {string | URL} url
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
export async function safeFetch(url, init = {}) {
	let current = await assertPublicUrl(url)
	for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
		const response = await fetch(current.href, { ...init, redirect: 'manual' })
		const location = response.headers.get('location')
		if (response.status < 300 || response.status >= 400 || !location) return response
		current = await assertPublicUrl(new URL(location, current))
	}
	throw new Error(`Too many redirects fetching ${new URL(url).hostname}`)
}
