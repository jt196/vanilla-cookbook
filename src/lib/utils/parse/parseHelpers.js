import parseIsoDuration from 'parse-iso-duration'
import humanizeDuration from 'humanize-duration'

export function parseRecipeToJSON(jsonLD) {
	if (!jsonLD) return undefined

	const json = JSON.parse(jsonLD)

	if (Array.isArray(json)) {
		const recipe = json.find((v) => {
			if (typeof v['@type'] === 'string') {
				return v['@type'].toLowerCase() === 'recipe'
			} else if (Array.isArray(v['@type'])) {
				return v['@type'].includes('Recipe')
			}
			return false
		})
		return recipe
	} else {
		return json
	}
}

export function getAuthor(author) {
	if (typeof author === 'string') return author
	if (Array.isArray(author)) return author[0].name
	return author?.name
}

export function durationToText(duration) {
	try {
		const durationObject = parseIsoDuration(duration)
		return humanizeDuration(durationObject)
	} catch (error) {
		return undefined
	}
}

export function parseInstructions(instructions) {
	if (!instructions) return []
	return instructions.map((v) => v.text || v.name || '')
}

export function getUrl(recipe) {
	if (typeof recipe.mainEntityOfPage === 'string') return recipe.mainEntityOfPage
	if (recipe.mainEntityOfPage?.['@id']?.includes('http')) return recipe.mainEntityOfPage['@id']
	return typeof recipe.isPartOf === 'string' ? recipe.isPartOf : recipe.isPartOf?.url
}

export function getImage(image) {
	if (!image) return undefined
	if (typeof image === 'string') return image
	if (Array.isArray(image)) return image[0].url
	return image.url
}

export function getRating(rating) {
	if (!rating) return undefined
	return parseFloat(rating.ratingValue)
}

export function parseVideo(video) {
	if (!video) return {}
	if (typeof video === 'string') return { videoUrl: video }
	if (Array.isArray(video)) {
		return {
			videoUrl: video[0].url || video[0].embedUrl,
			videoThumbnail: video[0].thumbnailUrl,
			videoTitle: video[0].name
		}
	}
	return {
		videoThumbnail: video.thumbnailUrl,
		videoTitle: video.name,
		videoUrl: video.contentUrl || video.embedUrl
	}
}

export function getNutrition(nutrition) {
	if (!nutrition) return undefined
	return nutrition
}
