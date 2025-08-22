// src/lib/utils/import/registry.js
import { importChowdownFromBuffer } from '$lib/utils/import/sources/chowdown'
import { importPaprikaFromBuffer } from '$lib/utils/import/sources/paprika'
import { importMealieFromBuffer } from '$lib/utils/import/sources/mealie'
import { importMyRecipeBoxFromBuffer } from '$lib/utils/import/sources/myrecipebox'
import { importNextcloudFromBuffer } from '$lib/utils/import/sources/nextcloud'
import { importPlanToEatFromBuffer } from '$lib/utils/import/sources/plantoeat'
import { importRecipeKeeperFromBuffer } from '$lib/utils/import/sources/recipekeeper'
import { importTandoorFromBuffer } from '$lib/utils/import/sources/tandoor.js'

export const importers = {
	paprika: {
		label: 'Paprika Recipe Manager (.zip or .paprikarecipes)',
		accepts: ['.paprikarecipes', '.zip'],
		magicOk: async (kind) => !kind || kind.ext === 'zip',
		run: importPaprikaFromBuffer,
		info: 'Upload a .paprikarecipes file, or a .zip that contains one or more .paprikarecipe files.'
	},
	chowdown: {
		label: 'Chowdown (.zip)',
		accepts: ['.zip'],
		magicOk: async (kind) => !kind || kind.ext === 'zip',
		run: importChowdownFromBuffer,
		info: 'Upload chowdown.zip containing _recipes/*.md and images/* (optional).'
	},
	mealie: {
		label: 'Mealie (.zip)',
		accepts: ['.zip'],
		magicOk: async (kind) => !kind || kind.ext === 'zip',
		run: importMealieFromBuffer,
		info: 'Upload a .zip with recipes/<dir>/*.json and recipes/<dir>/images/*.'
	},
	myrecipebox: {
		label: 'MyRecipeBox (.csv)',
		accepts: ['.csv'],
		magicOk: async (kind) =>
			!kind || (kind.mime && (kind.mime.includes('csv') || kind.mime.startsWith('text/'))),
		run: importMyRecipeBoxFromBuffer,
		info: 'Upload a CSV with columns like name, ingredients, directions, source/url, times, servings, notes.'
	},
	nextcloud: {
		label: 'Nextcloud (.zip)',
		accepts: ['.zip'],
		magicOk: async (kind) => !kind || kind.ext === 'zip',
		run: importNextcloudFromBuffer,
		info: 'Upload a .zip with <dir>/recipe.json and <dir>/full.jpg (thumb.jpg optional).'
	},
	plantoeat: {
		label: 'PlanToEat (.csv)',
		accepts: ['.csv'],
		magicOk: async (kind) =>
			!kind || (kind.mime && (kind.mime.includes('csv') || kind.mime.startsWith('text/'))),
		run: importPlanToEatFromBuffer,
		info: 'Upload a PlanToEat export CSV.'
	},
	recipekeeper: {
		label: 'Recipe Keeper (.zip)',
		accepts: ['.zip'],
		magicOk: async (kind) => !kind || kind.ext === 'zip',
		run: importRecipeKeeperFromBuffer,
		info: 'Upload a Recipe Keeper export .zip'
	},
	tandoor: {
		label: 'Tandoor (.zip)',
		accepts: ['.zip'],
		magicOk: async (kind) => !kind || kind.ext === 'zip',
		run: importTandoorFromBuffer,
		info: 'Upload a Tandoor export .zip (contains numbered .zip members, each with recipe.json and an image).'
	}
}
