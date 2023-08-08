/**
 * Provides functionalities related to articles.
 */

// Imports necessary utilities and types.
import { prisma } from '$lib/server/prisma'
import { error, fail, redirect } from '@sveltejs/kit'

/**
 * Loads articles from the database.
 *
 * @async
 * @returns {Promise<Object>} Returns an object containing all the articles.
 */
export const load = async () => {
	return {
		articles: await prisma.article.findMany()
	}
}

/**
 * Contains action methods related to articles.
 * @namespace actions
 */
export const actions = {
	/**
	 * Creates a new article.
	 *
	 * @async
	 * @param {Object} context - The context object.
	 * @param {Object} context.request - The request object.
	 * @param {AppLocals} context.locals - Contains session and user information.
	 * @returns {Promise<Object>} The response object after creating an article.
	 */
	createArticle: async ({ request, locals }) => {
		const { session, user } = await locals.auth.validateUser()
		if (!session || !user) {
			throw redirect(302, '/')
		}

		const { title, content } = Object.fromEntries(await request.formData())

		try {
			await prisma.article.create({
				data: {
					title,
					content,
					userId: user.userId
				}
			})
		} catch (err) {
			console.error(err)
			return fail(500, { message: 'Could not create the article.' })
		}

		return {
			status: 201
		}
	},

	/**
	 * Deletes an article by its ID.
	 *
	 * @async
	 * @param {Object} context - The context object.
	 * @param {Object} context.url - The URL object.
	 * @param {AppLocals} context.locals - Contains session and user information.
	 * @returns {Promise<Object>} The response object after deleting an article.
	 */
	deleteArticle: async ({ url, locals }) => {
		const { session, user } = await locals.auth.validateUser()
		if (!session || !user) {
			throw redirect(302, '/')
		}
		const id = url.searchParams.get('id')
		if (!id) {
			return fail(400, { message: 'Invalid request' })
		}

		try {
			const article = await prisma.article.findUniqueOrThrow({
				where: {
					id
				}
			})

			if (article.userId !== user.userId) {
				throw error(403, 'Not authorized')
			}

			await prisma.article.delete({
				where: {
					id
				}
			})
		} catch (err) {
			console.error(err)
			return fail(500, {
				message: 'Something went wrong deleting your article'
			})
		}

		return {
			status: 200
		}
	}
}
