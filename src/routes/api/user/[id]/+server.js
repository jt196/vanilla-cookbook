import { prisma } from '$lib/server/prisma'

export const PUT = async ({ request, locals, params }) => {
	const { session, user } = await locals.auth.validateUser()
	const bodyText = await request.text()
	const userData = JSON.parse(bodyText)
	const { id } = params

	if (!session || !user) {
		return new Response('User not authenticated!', {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		const existingUser = await prisma.authUser.findUnique({
			where: { id: id }
		})

		if (!existingUser) {
			return new Response('User not found!', {
				status: 404,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		console.log('🚀 ~ file: +server.js:33 ~ PUT ~ existingUser:', existingUser)
		console.log('🚀 ~ file: +server.js:34 ~ PUT ~ user:', user)
		if (existingUser.id !== user.userId || !user.isAdmin) {
			return new Response('Unauthorised to update this user!', {
				status: 401,
				headers: {
					'Content-Type': 'application/json'
				}
			})
		}

		const updatedUser = await prisma.authUser.update({
			where: { id: id },
			data: {
				name: userData.name || existingUser.name,
				username: userData.username || existingUser.username,
				email: userData.email || existingUser.email,
				about: userData.about || existingUser.about,
				isAdmin: 'isAdmin' in userData ? userData.isAdmin : existingUser.isAdmin
			}
		})

		return new Response(JSON.stringify(updatedUser), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: `Failed to update user: ${error.message}` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
