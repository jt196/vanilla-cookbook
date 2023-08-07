import type { Actions } from './$types'
import { prisma } from '$lib/server/prisma'
import { fail, redirect } from '@sveltejs/kit'
import { parseURL } from 'html-recipe-parser'

export const actions: Actions = {
	createRecipe: async ({ request, locals }) => {
		const { session, user } = await locals.auth.validateUser()
		if (!session || !user) {
			throw redirect(302, '/')
		}

		const {
			name,
			description,
			source,
			source_url,
			cook_time,
			image_url,
			prep_time,
			ingredients,
			directions,
			total_time,
			servings,
			nutritional_info
		} = Object.fromEntries(await request.formData()) as Record<string, string>

		try {
			await prisma.recipe.create({
				data: {
					name,
					description,
					source,
					source_url,
					cook_time,
					image_url,
					prep_time,
					ingredients,
					directions,
					total_time,
					servings,
					nutritional_info,
					created: new Date(),
					userId: user.userId
				}
			})
		} catch (err) {
			console.error(err)
			return fail(500, { message: 'Could not create the recipe.' })
		}
		throw redirect(302, '/recipe')
	},
	scrapeRecipe: async ({ request, locals }) => {
		const { session, user } = await locals.auth.validateUser()
		if (!session || !user) {
			throw redirect(302, '/')
		}

		const { url } = Object.fromEntries(await request.formData()) as Record<string, string>

		try {
			const recipeArrayText = JSON.stringify(await parseURL(url))
			return { body: recipeArrayText }
		} catch (err) {
			console.error(err)
			return fail(500, { message: 'Could not scrape the recipe.' })
		}
	}
}
