import { auth } from '$lib/server/lucia'
import { validatePassword } from '$lib/utils/security.js'

export const POST = async ({ request, locals }) => {
	const session = await locals.auth.validate()
	const user = session.user
	const bodyText = await request.text()
	const userData = JSON.parse(bodyText)

	if (!session || !user) {
		return new Response(JSON.stringify({ error: 'User not authenticated.' }), {
			status: 401,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	// Ensure the user is an admin
	if (!user.isAdmin) {
		return new Response(
			JSON.stringify({ error: 'Unauthorized! You must be an admin to create users.' }),
			{
				status: 401,
				headers: {
					'Content-Type': 'application/json'
				}
			}
		)
	}

	const passwordValidation = validatePassword(userData.password)

	if (!passwordValidation.isValid) {
		return new Response(JSON.stringify({ error: passwordValidation.message }), {
			status: 400,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}

	try {
		const newUser = await auth.createUser({
			key: {
				providerId: 'username',
				providerUserId: userData.username,
				password: userData.password
			},
			attributes: {
				name: userData.name,
				username: userData.username,
				about: userData.about,
				email: userData.email,
				isAdmin: userData.isAdmin
			}
		})
		return new Response(JSON.stringify(newUser), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (err) {
		console.error(err)
		return new Response(JSON.stringify({ error: `Failed to update user` }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
