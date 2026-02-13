import { prisma } from '$lib/server/prisma'
import { requireAdmin, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { normalizeBoolean } from '$lib/utils/normalize'

export async function POST({ request, locals }) {
	requireAdmin(locals)
	const siteData = await request.json()

	const registrationAllowed = normalizeBoolean(siteData.registrationAllowed)
	if (registrationAllowed === null) {
		return jsonError(400, 'Invalid input data')
	}

	try {
		const settings = await prisma.siteSettings.findFirst()
		const updatedSettings = await prisma.siteSettings.update({
			where: { id: settings.id },
			data: {
				registrationAllowed,
				requireLogin: normalizeBoolean(siteData.requireLogin) ?? settings.requireLogin,
				oidcAutoProvision:
					normalizeBoolean(siteData.oidcAutoProvision) ?? settings.oidcAutoProvision,
				llmEnabled: normalizeBoolean(siteData.llmEnabled) ?? settings.llmEnabled,
				llmProvider: siteData.llmProvider ?? settings.llmProvider,
				llmTextModel: siteData.llmTextModel ?? settings.llmTextModel,
				llmImageModel: siteData.llmImageModel ?? settings.llmImageModel,
				semanticEnabled: normalizeBoolean(siteData.semanticEnabled) ?? settings.semanticEnabled,
				semanticEmbeddingProvider:
					siteData.semanticEmbeddingProvider ?? settings.semanticEmbeddingProvider,
				semanticEmbeddingModel: siteData.semanticEmbeddingModel ?? settings.semanticEmbeddingModel
			}
		})
		return jsonSuccess(updatedSettings)
	} catch (err) {
		return jsonError(500, `Failed to update site settings: ${err.message}`)
	}
}
