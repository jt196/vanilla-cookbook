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
		command: 'npm run build && npm run preview',
		port: 4173
	},
	testDir: 'tests'
}

export default config
