import { vi } from 'vitest'

// Tests stub `fetch` and must not depend on real DNS. safeFetch resolves hostnames before
// fetching, so resolve every hostname to a public documentation address by default.
// Tests can override with `vi.mocked(lookup).mockResolvedValueOnce(...)`.
vi.mock('node:dns/promises', () => ({
	lookup: vi.fn(async () => [{ address: '93.184.216.34', family: 4 }])
}))
