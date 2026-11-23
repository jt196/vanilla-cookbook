// Using relative import as this will run before app startup
import { recipeTimeFields } from '../recipeTime.js'

const TIME_FIELDS = /** @type {const} */ ([
	'prep_time',
	'cook_time',
	'total_time',
	'prep_minutes',
	'cook_minutes',
	'total_minutes'
])

/**
 * Brings every recipe's times up to the current format: text to ISO 8601 where that loses
 * nothing, and the minute columns filled in. Runs at startup with the seed; only rows whose
 * values change are written, so later runs do almost nothing.
 *
 * @param {import('@prisma/client').PrismaClient} prisma
 * @returns {Promise<number>} The number of recipes updated.
 */
export async function backfillRecipeTimes(prisma) {
	const recipes = await prisma.recipe.findMany({
		where: {
			OR: [
				{ prep_time: { not: null } },
				{ cook_time: { not: null } },
				{ total_time: { not: null } }
			]
		},
		select: {
			uid: true,
			prep_time: true,
			cook_time: true,
			total_time: true,
			prep_minutes: true,
			cook_minutes: true,
			total_minutes: true
		}
	})

	const updates = []
	for (const recipe of recipes) {
		const fields = recipeTimeFields(recipe)
		if (TIME_FIELDS.some((f) => fields[f] !== recipe[f])) {
			updates.push(prisma.recipe.update({ where: { uid: recipe.uid }, data: fields }))
		}
	}
	for (let i = 0; i < updates.length; i += 200) {
		await prisma.$transaction(updates.slice(i, i + 200))
	}
	if (updates.length) console.log(`Recipe times updated on ${updates.length} recipes.`)
	return updates.length
}
