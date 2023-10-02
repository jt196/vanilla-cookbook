import { prisma } from '$lib/server/prisma'

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export const POST = async ({ request, locals }) => {
	const { session, user } = await locals.auth.validateUser()
	const siteData = await request.json()
	console.log('🚀 ~ file: +server.js:8 ~ POST ~ siteData:', siteData)

	if (!session || !user) {
		return new Response('User not authenticated!', { status: 401, headers: JSON_HEADERS })
	}

	if (!user.isAdmin) {
		return new Response('Unauthorised to update this site settings!', {
			status: 403,
			headers: JSON_HEADERS
		})
	}

	// Validate siteData before using
	if (typeof siteData.registrationAllowed !== 'boolean') {
		return new Response('Invalid input data', { status: 400, headers: JSON_HEADERS })
	}

	try {
		const settings = await prisma.siteSettings.findFirst()
		const updatedSettings = await prisma.siteSettings.update({
			where: { id: settings.id },
			data: {
				registrationAllowed: siteData.registrationAllowed
			}
		})
		return new Response(JSON.stringify(updatedSettings), { status: 200, headers: JSON_HEADERS })
	} catch (error) {
		return new Response(
			JSON.stringify({ error: `Failed to update site settings: ${error.message}` }),
			{
				status: 500,
				headers: JSON_HEADERS
			}
		)
	}
}
