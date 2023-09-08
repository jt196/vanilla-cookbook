export const siteConfigurations = {
	'afghankitchenrecipes.com': {
		servingsSelector: 'li.servings .value',
		prepTimeSelector: 'li.prep-time .value',
		cookTimeSelector: 'li.cook-time .value',
		totalTimeSelector: 'li.ready-in .value',
		ingredientsSelector: 'li.ingredient',
		instructionsSelector: 'p.instructions',
		descriptionSelector: 'div.info-left.instructions',
		nameSelector: 'h2.title'
	},
	'ethanchlebowski.com': {
		ingredientsSelector: '.sqs-html-content ul[data-rte-list="default"] li p',
		nameSelector: '.BlogItem-title',
		instructionsSelector: '.sqs-html-content > h1 ~ p'
	},
	'en.wikibooks.org': {
		nameSelector: '.infobox-above',
		descriptionSelector: 'table.mw-collapsible + p',
		ingredientsSelector: 'h2:has(span[id="Ingredients"]) + ul li',
		instructionsSelector: 'h2:has(span[id="Procedure"]) + ol li',
		notesSelector: 'h2:has(span[id="Notes,_tips,_and_variations"]) + ul li',
		categorySelector: '.infobox-label:contains("Category") + .infobox-data a',
		servingsSelector: '.infobox-label:contains("Yield") + .infobox-data',
		totalTimeSelector: '.infobox-label:contains("Time") + .infobox-data'
	}
}
