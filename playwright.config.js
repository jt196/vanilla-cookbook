/**
 * @typedef {Object} WebServerConfig
 * @property {string} command - The command to run for the web server.
 * @property {number} port - The port for the web server.
 */

/**
 * @typedef {Object} PlaywrightTestConfigJSDoc
 * @property {WebServerConfig} webServer - Web server configuration.
 * @property {string} testDir - The test directory.
 */

/**
 * Playwright test configuration.
 *
 * @type {PlaywrightTestConfigJSDoc}
 */
const config = {
	webServer: {
		command: 'node tests/scripts/run-e2e-server.js',
		port: 4173,
		reuseExistingServer: false
	},
	testDir: 'src/tests/e2e',
	use: {
		baseURL: 'http://127.0.0.1:4173'
	},
	fullyParallel: false,
	workers: 1,
	projects: [
		{
			name: 'chromium',
			use: { browserName: 'chromium' }
		},
		{
			name: 'firefox',
			use: { browserName: 'firefox' }
		},
		{
			name: 'webkit',
			use: { browserName: 'webkit' }
		}
	]
}

export default config
