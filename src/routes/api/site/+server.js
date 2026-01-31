import { prisma } from '$lib/server/prisma'
import { requireAdmin, jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function POST({ request, locals }) {
	requireAdmin(locals)
	const siteData = await request.json()

	if (typeof siteData.registrationAllowed !== 'boolean') {
		return jsonError(400, 'Invalid input data')
	}

	try {
		const settings = await prisma.siteSettings.findFirst()
		const updatedSettings = await prisma.siteSettings.update({
			where: { id: settings.id },
			data: {
				registrationAllowed: siteData.registrationAllowed
			}
		})
		return jsonSuccess(updatedSettings)
	} catch (err) {
		return jsonError(500, `Failed to update site settings: ${err.message}`)
	}
}
