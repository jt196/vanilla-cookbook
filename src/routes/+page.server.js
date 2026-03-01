import { redirect } from '@sveltejs/kit'
import { prisma } from '$lib/server/prisma'

const MIN_ROW = 3
const ROW_SIZE = 12

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals }) => {
	if (!locals.site.dbSeeded) {
		throw redirect(302, '/setup')
	}

	const user = locals.user
	if (!user) {
		throw redirect(302, '/login')
	}

	const userId = user.userId

	const photoSelect = {
		uid: true,
		name: true,
		image_url: true,
		photos: {
			where: { isMain: true },
			select: { id: true },
			take: 1
		}
	}

	const baseWhere = { userId, in_trash: false }

	// Run independent queries in parallel
	const [recentlyAdded, favourites, mostCookedLogs, recentlyCookedLogs, allUids] =
		await Promise.all([
			prisma.recipe.findMany({
				where: baseWhere,
				orderBy: { created: 'desc' },
				take: ROW_SIZE,
				select: photoSelect
			}),
			prisma.recipe.findMany({
				where: { ...baseWhere, on_favorites: true },
				take: ROW_SIZE,
				select: photoSelect
			}),
			prisma.recipeLog.groupBy({
				by: ['recipeUid'],
				where: { userId },
				_count: { recipeUid: true },
				orderBy: { _count: { recipeUid: 'desc' } },
				take: ROW_SIZE * 2
			}),
			prisma.recipeLog.groupBy({
				by: ['recipeUid'],
				where: { userId },
				_max: { cooked: true },
				orderBy: { _max: { cooked: 'desc' } },
				take: ROW_SIZE * 2
			}),
			prisma.recipe.findMany({
				where: baseWhere,
				select: { uid: true }
			})
		])

	// Fetch recipe details for the log-based rows (filter trashed in DB)
	const mostCookedUids = mostCookedLogs.map((l) => l.recipeUid)
	const recentlyCookedUids = recentlyCookedLogs.map((l) => l.recipeUid)

	const [mostCookedRecipes, recentlyCookedRecipes] = await Promise.all([
		mostCookedUids.length
			? prisma.recipe.findMany({
					where: { uid: { in: mostCookedUids }, in_trash: false },
					select: photoSelect
				})
			: [],
		recentlyCookedUids.length
			? prisma.recipe.findMany({
					where: { uid: { in: recentlyCookedUids }, in_trash: false },
					select: photoSelect
				})
			: []
	])

	// Restore log ordering and trim to ROW_SIZE
	const mostCooked = mostCookedUids
		.map((uid) => mostCookedRecipes.find((r) => r.uid === uid))
		.filter(Boolean)
		.slice(0, ROW_SIZE)

	const recentlyCooked = recentlyCookedUids
		.map((uid) => recentlyCookedRecipes.find((r) => r.uid === uid))
		.filter(Boolean)
		.slice(0, ROW_SIZE)

	// Random sample — shuffle all uids in JS, then fetch details
	const shuffled = allUids.sort(() => Math.random() - 0.5).slice(0, ROW_SIZE)
	const random =
		shuffled.length >= MIN_ROW
			? await prisma.recipe.findMany({
					where: { uid: { in: shuffled.map((r) => r.uid) } },
					select: photoSelect
				})
			: []

	// Apply minimum threshold — hide rows with too few recipes
	const highlights = {
		recentlyAdded: recentlyAdded.length >= MIN_ROW ? recentlyAdded : [],
		favourites: favourites.length >= MIN_ROW ? favourites : [],
		mostCooked: mostCooked.length >= MIN_ROW ? mostCooked : [],
		recentlyCooked: recentlyCooked.length >= MIN_ROW ? recentlyCooked : [],
		random
	}

	return { highlights }
}
