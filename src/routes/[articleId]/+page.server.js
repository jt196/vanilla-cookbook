import { prisma } from '$lib/server/prisma'
import { error, fail } from '@sveltejs/kit'

/**
 * Loads an article based on provided parameters and authorization status.
 *
 * @param {Object} context - The context object.
 * @param {Object} context.params - The parameters from the request.
 * @param {AppLocals} context.locals - Local variables.
 * @returns {Promise<Object>} - A promise resolving with the article data.
 */
export const load = async ({ params, locals }) => {
	const { session, user } = await locals.auth.validateUser()
	if (!session || !user) {
		throw error(401, 'Unauthorized')
	}

	/**
	 * Retrieves an article for a given user ID.
	 *
	 * @param {string} userId - The user's ID.
	 * @returns {Promise<Object>} - A promise resolving with the article data.
	 */
	const getArticle = async (userId) => {
		const article = await prisma.article.findUnique({
			where: {
				id: params.articleId
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

/**
 * Actions related to articles, such as updating.
 *
 * @type {Object}
 */
export const actions = {
	/**
	 * Updates an article's title and content.
	 *
	 * @param {Object} context - The context object.
	 * @param {Object} context.request - The request data.
	 * @param {Object} context.params - The parameters from the request.
	 * @param {AppLocals} context.locals - Local variables.
	 * @returns {Promise<Object>} - A promise resolving with the status or error message.
	 */
	updateArticle: async ({ request, params, locals }) => {
		const { session, user } = await locals.auth.validateUser()
		if (!session || !user) {
			throw error(401, 'Unauthorized')
		}

		const formData = Object.fromEntries(await request.formData())
		const { title, content } = /** @type {Record<string, string>} */ (formData)

		try {
			const article = await prisma.article.findUniqueOrThrow({
				where: {
					id: params.articleId
				}
			})

			if (article.userId !== user.userId) {
				throw error(403, 'Forbidden to edit this article.')
			}
			await prisma.article.update({
				where: {
					id: params.articleId
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
