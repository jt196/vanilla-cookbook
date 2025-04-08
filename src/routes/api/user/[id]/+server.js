import { prisma } from '$lib/server/prisma'

export const PUT = async ({ request, locals, params }) => {
	const session = await locals.auth.validate()
	const user = session?.user
	const { id } = params

	if (!session || !user || user.userId !== id) {
		return new Response(JSON.stringify({ error: 'User not authenticated or wrong user.' }), {
			status: 403,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	const userData = await request.json()
	const allowedFields = [
		'theme',
		'language',
		'units',
		'skipSmallUnits',
		'publicProfile',
		'publicRecipes',
		'ingMatch',
		'ingOriginal',
		'ingExtra',
		'ingSymbol',
		'about',
		'name'
	]

	const updates = Object.fromEntries(
		Object.entries(userData).filter(([key]) => allowedFields.includes(key))
	)

	if (Object.keys(updates).length === 0) {
		return new Response('No valid fields to update.', { status: 400 })
	}

	const updatedUser = await prisma.authUser.update({
		where: { id: id },
		data: updates
	})

	return new Response(JSON.stringify(updatedUser), {
		status: 200,
		headers: {
			'Content-Type': 'application/json'
		}
	})
}

export async function GET({ locals, params }) {
	const { id } = params
	const userProfile = await prisma.authUser.findUnique({
		where: { id: id }
	})
	const session = await locals.auth.validate()
	const user = session?.user
	if (!userProfile.publicProfile && (!session || !user)) {
		console.log('Not public profile, or no session or user!')
		return new Response('User not authenticated!', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
	try {
		return new Response(JSON.stringify({ userProfile: userProfile }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: `Failed to fetch users: ${error.message}` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
