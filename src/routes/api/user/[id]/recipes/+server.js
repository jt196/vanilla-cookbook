import { prisma } from '$lib/server/prisma'

export async function GET({ params, locals }) {
	const requestedUserId = params.id // Extracting the uid from the request parameters

	// Validate the requesting user's session and get their userId
	const session = await locals.auth.validate()
	const user = session?.user

	let whereClause = {
		userId: requestedUserId // Ensure recipes belong to the requested user
	}

	// If the requesting user's ID doesn't match the requested ID, only fetch public recipes
	if (!user || user.userId !== requestedUserId) {
		whereClause.is_public = true // Assuming `isPublic` is a field in your Recipe model indicating if a recipe is public or not
	}

	try {
		const recipes = await prisma.recipe.findMany({
			where: whereClause,
			orderBy: {
				created: 'desc'
			},
			include: {
				categories: {
					select: {
						category: {
							select: {
								name: true,
								uid: true
							}
						}
					}
				},
				log: true,
				photos: {
					orderBy: [
						{ isMain: 'desc' }, // true first
						{ id: 'asc' } // fallback to earliest if no isMain
					],
					select: {
						id: true,
						fileType: true
					}
				}
			}
		})

		const updatedRecipes = recipes.map((recipe) => {
			const mainOrFirstPhoto = recipe.photos[0] || null
			return {
				...recipe,
				photos: mainOrFirstPhoto ? [mainOrFirstPhoto] : []
			}
		})

		return new Response(JSON.stringify(updatedRecipes), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		console.error(error)
		return new Response(JSON.stringify({ error: 'Failed to fetch recipes.' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
