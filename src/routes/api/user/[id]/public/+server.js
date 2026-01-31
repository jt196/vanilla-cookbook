import { prisma } from '$lib/server/prisma'
import { jsonSuccess, jsonError } from '$lib/server/authHelpers'

export async function GET({ params }) {
	const { id } = params

	try {
		const userProfile = await prisma.authUser.findUnique({
			where: { id },
			select: {
				username: true,
				id: true,
				publicProfile: true,
				useCats: true
			}
		})

		return jsonSuccess({ userProfile })
	} catch (err) {
		console.error('Error fetching user profile:', err)
		return jsonError(500, 'Internal server error.')
	}
}
