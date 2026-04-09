import { prisma } from '$lib/server/prisma'
import { requireAdmin, jsonSuccess, jsonError } from '$lib/server/authHelpers'
import { normalizeBoolean } from '$lib/utils/normalize'

export async function POST({ request, locals }) {
	requireAdmin(locals)
	const siteData = await request.json()
	const hasRegistrationAllowed = Object.prototype.hasOwnProperty.call(
		siteData,
		'registrationAllowed'
	)
	const normalizedRegistrationAllowed = normalizeBoolean(siteData.registrationAllowed)
	if (hasRegistrationAllowed && normalizedRegistrationAllowed === null) {
		return jsonError(400, {
			error: 'Invalid input data: registrationAllowed must be boolean.',
			code: 'admin.site.msg.invalidRegistrationAllowed'
		})
	}

	try {
		const settings = await prisma.siteSettings.findFirst()
		const registrationAllowed = hasRegistrationAllowed
			? normalizedRegistrationAllowed
			: settings.registrationAllowed
		const updatedSettings = await prisma.siteSettings.update({
			where: { id: settings.id },
			data: {
				registrationAllowed,
				requireLogin: normalizeBoolean(siteData.requireLogin) ?? settings.requireLogin,
				oidcAutoProvision:
					normalizeBoolean(siteData.oidcAutoProvision) ?? settings.oidcAutoProvision,
				llmEnabled: normalizeBoolean(siteData.llmEnabled) ?? settings.llmEnabled,
				llmProvider: siteData.llmProvider ?? settings.llmProvider,
				llmImageProvider: siteData.llmImageProvider ?? settings.llmImageProvider,
				llmImageGenerationProvider:
					siteData.llmImageGenerationProvider ?? settings.llmImageGenerationProvider,
				llmTextModel: siteData.llmTextModel ?? settings.llmTextModel,
				llmImageModel: siteData.llmImageModel ?? settings.llmImageModel,
				llmImageGenerationModel:
					siteData.llmImageGenerationModel ?? settings.llmImageGenerationModel,
				semanticEnabled: normalizeBoolean(siteData.semanticEnabled) ?? settings.semanticEnabled,
				semanticEmbeddingProvider:
					siteData.semanticEmbeddingProvider ?? settings.semanticEmbeddingProvider,
				semanticEmbeddingModel: siteData.semanticEmbeddingModel ?? settings.semanticEmbeddingModel
			}
		})
		return jsonSuccess(updatedSettings)
	} catch (err) {
		console.error('Failed to update site settings', {
			userId: locals?.user?.userId ?? null,
			fields: Object.keys(siteData || {}),
			llmProvider: siteData?.llmProvider ?? null,
			llmImageProvider: siteData?.llmImageProvider ?? null,
			llmImageGenerationProvider: siteData?.llmImageGenerationProvider ?? null,
			semanticEmbeddingProvider: siteData?.semanticEmbeddingProvider ?? null,
			hasLlmTextModel: !!siteData?.llmTextModel,
			hasLlmImageModel: !!siteData?.llmImageModel,
			hasLlmImageGenerationModel: !!siteData?.llmImageGenerationModel,
			hasSemanticEmbeddingModel: !!siteData?.semanticEmbeddingModel,
			error: err?.message
		})
		return jsonError(500, {
			error: `Failed to update site settings: ${err.message}`,
			code: 'admin.site.msg.settingsUpdateFail'
		})
	}
}
