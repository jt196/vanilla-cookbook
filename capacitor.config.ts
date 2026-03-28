import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
	appId: 'com.vanillacookbook.app',
	appName: 'Vanilla Cookbook',
	webDir: 'android-web',
	server: {
		// No server.url — loads the bundled setup page from webDir.
		// The setup page redirects to the user-configured server URL at runtime.
		cleartext: true, // allow http:// for local/dev servers
		allowNavigation: ['*']
	}
}

export default config
