import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { lookup } from 'node:dns/promises'
import { assertPublicUrl, isPrivateAddress, safeFetch } from '$lib/server/safeFetch'

import { fake } from './helpers/fake.js'
describe('isPrivateAddress', () => {
	it.each([
		'127.0.0.1',
		'10.1.2.3',
		'172.16.0.1',
		'172.31.255.255',
		'192.168.1.10',
		'169.254.169.254',
		'100.64.0.1',
		'0.0.0.0',
		'224.0.0.1',
		'255.255.255.255',
		'::1',
		'::',
		'fd00::1',
		'fe80::1',
		'::ffff:127.0.0.1',
		'::ffff:10.0.0.1'
	])('blocks %s', (ip) => {
		expect(isPrivateAddress(ip)).toBe(true)
	})

	it.each(['93.184.216.34', '8.8.8.8', '172.15.255.255', '172.32.0.1', '2606:4700::1111'])(
		'allows %s',
		(ip) => {
			expect(isPrivateAddress(ip)).toBe(false)
		}
	)
})

describe('assertPublicUrl', () => {
	beforeEach(() => vi.mocked(lookup).mockClear())

	it.each(['file:///etc/passwd', 'ftp://example.com/x', 'data:text/plain,hi'])(
		'rejects %s',
		async (url) => {
			await expect(assertPublicUrl(url)).rejects.toThrow(/Only http and https/)
		}
	)

	it('rejects IP literals in private ranges without a DNS lookup', async () => {
		await expect(assertPublicUrl('http://127.0.0.1:3000/')).rejects.toThrow(/not a public/)
		await expect(assertPublicUrl('http://[::1]/')).rejects.toThrow(/not a public/)
		expect(lookup).not.toHaveBeenCalled()
	})

	it('rejects hostnames that resolve to any private address', async () => {
		vi.mocked(lookup).mockResolvedValueOnce(
			fake([
				{ address: '93.184.216.34', family: 4 },
				{ address: '10.0.0.5', family: 4 }
			])
		)
		await expect(assertPublicUrl('https://sneaky.example/')).rejects.toThrow(/not a public/)
	})

	it('accepts hostnames that resolve to public addresses', async () => {
		const parsed = await assertPublicUrl('https://www.example.com/recipe')
		expect(parsed.hostname).toBe('www.example.com')
	})
})

describe('safeFetch', () => {
	let fetchMock

	beforeEach(() => {
		fetchMock = vi.fn()
		vi.stubGlobal('fetch', fetchMock)
	})

	afterEach(() => vi.unstubAllGlobals())

	it('fetches with manual redirects and passes other options through', async () => {
		fetchMock.mockResolvedValue(new Response('ok'))
		const res = await safeFetch('https://example.com/a', { headers: { 'X-Test': '1' } })
		expect(await res.text()).toBe('ok')
		const [url, init] = fetchMock.mock.calls[0]
		expect(String(url)).toBe('https://example.com/a')
		expect(init).toMatchObject({ redirect: 'manual', headers: { 'X-Test': '1' } })
	})

	it('follows public redirects, resolving relative locations', async () => {
		fetchMock
			.mockResolvedValueOnce(new Response(null, { status: 301, headers: { location: '/b' } }))
			.mockResolvedValueOnce(new Response('done'))
		const res = await safeFetch('https://example.com/a')
		expect(await res.text()).toBe('done')
		expect(String(fetchMock.mock.calls[1][0])).toBe('https://example.com/b')
	})

	it('refuses a redirect to a private address', async () => {
		fetchMock.mockResolvedValueOnce(
			new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/admin' } })
		)
		await expect(safeFetch('https://example.com/a')).rejects.toThrow(/not a public/)
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})

	it('gives up after too many redirects', async () => {
		fetchMock.mockImplementation(
			async () => new Response(null, { status: 302, headers: { location: '/loop' } })
		)
		await expect(safeFetch('https://example.com/a')).rejects.toThrow(/Too many redirects/)
	})

	it('returns non-redirect error responses as-is', async () => {
		fetchMock.mockResolvedValue(new Response('nope', { status: 404 }))
		expect((await safeFetch('https://example.com/a')).status).toBe(404)
	})
})
