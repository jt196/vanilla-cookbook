import type { Actions, PageServerLoad } from './$types'
import { prisma } from '$lib/server/prisma'
import { error, fail } from '@sveltejs/kit'

export const load: PageServerLoad = async ({ params, locals }) => {
	const { session, user } = await locals.auth.validateUser()
	if (!session || !user) {
		throw error(401, 'Unauthorized')
	}

	const getArticle = async (userId: string) => {
		const article = await prisma.article.findUnique({
			where: {
				id: Number(params.articleId)
			}
		})
		if (!article) {
			throw error(404, 'Article not found')
		}
		if (article.userId !== user.userId) {
			throw error(403, 'Unauthorized')
		}

		return article
	}

	return {
		article: getArticle(user.userId)
	}
}

export const actions: Actions = {
	updateArticle: async ({ request, params, locals }) => {
		const { session, user } = await locals.auth.validateUser()
		if (!session || !user) {
			throw error(401, 'Unauthorized')
		}

		const { title, content } = Object.fromEntries(await request.formData()) as Record<
			string,
			string
		>

		try {
			const article = await prisma.article.findUniqueOrThrow({
				where: {
					id: Number(params.articleId)
				}
			})

			if (article.userId !== user.userId) {
				throw error(403, 'Forbidden to edit this article.')
			}
			await prisma.article.update({
				where: {
					id: Number(params.articleId)
				},
				data: {
					title,
					content
				}
			})
		} catch (err) {
			console.error(err)
			return fail(500, { message: 'Could not update article' })
		}

		return {
			status: 200
		}
	}
}
