const baseNutrientAliases = {
	calories: ['calories', 'calorie', 'energy', 'kcal', 'kilocalories'],
	carbohydrates: ['carbohydrate', 'carbohydrates', 'carbs', 'carb'],
	protein: ['protein', 'proteins'],
	fat: ['fat', 'total fat', 'fats'],
	saturatedFat: ['saturated fat'],
	transFat: ['trans fat'],
	polyunsaturatedFat: ['polyunsaturated fat'],
	monounsaturatedFat: ['monounsaturated fat'],
	cholesterol: ['cholesterol'],
	sodium: ['sodium', 'salt'],
	potassium: ['potassium'],
	fiber: ['fiber', 'fibre', 'dietary fiber', 'dietary fibre'],
	sugar: ['sugar', 'sugars'],
	vitaminA: ['vitamin a'],
	vitaminC: ['vitamin c'],
	vitaminD: ['vitamin d'],
	vitaminE: ['vitamin e'],
	vitaminK: ['vitamin k'],
	calcium: ['calcium'],
	iron: ['iron']
}

const baseDisplayNames = {
	calories: 'Calories',
	carbohydrates: 'Carbohydrates',
	protein: 'Protein',
	fat: 'Fat',
	saturatedFat: 'Saturated Fat',
	transFat: 'Trans Fat',
	polyunsaturatedFat: 'Polyunsaturated Fat',
	monounsaturatedFat: 'Monounsaturated Fat',
	cholesterol: 'Cholesterol',
	sodium: 'Sodium',
	potassium: 'Potassium',
	fiber: 'Fiber',
	sugar: 'Sugar',
	vitaminA: 'Vitamin A',
	vitaminC: 'Vitamin C',
	vitaminD: 'Vitamin D',
	vitaminE: 'Vitamin E',
	vitaminK: 'Vitamin K',
	calcium: 'Calcium',
	iron: 'Iron'
}

const baseIgnoreTokens = [
	'nutrition facts',
	'amount per serving',
	'% daily value',
	'daily value',
	'full nutrition',
	'guidelines',
	'servings:',
	'serving size',
	'amounts per',
	'this recipe is'
]

const baseExtraUnitAliases = {
	kcal: ['kcal'],
	kj: ['kj'],
	mg: ['mg'],
	g: ['g'],
	kg: ['kg'],
	mcg: ['mcg', 'µg', 'μg', 'ug'],
	iu: ['iu'],
	ml: ['ml'],
	l: ['l'],
	percent: ['%']
}

const nutritionI18n = {
	eng: {
		nutrientAliases: baseNutrientAliases,
		nutrientDisplayNames: baseDisplayNames,
		perServingPhrases: ['per serving', 'amount per serving', 'serving:'],
		ignoreTokens: baseIgnoreTokens,
		extraUnitAliases: {
			...baseExtraUnitAliases,
			kcal: [
				...baseExtraUnitAliases.kcal,
				'cal',
				'calorie',
				'calories',
				'kilocalorie',
				'kilocalories'
			],
			kj: [...baseExtraUnitAliases.kj, 'kilojoule', 'kilojoules'],
			mg: [...baseExtraUnitAliases.mg, 'milligram', 'milligrams'],
			g: [...baseExtraUnitAliases.g, 'gram', 'grams'],
			kg: [...baseExtraUnitAliases.kg, 'kilogram', 'kilograms'],
			mcg: [...baseExtraUnitAliases.mcg, 'microgram', 'micrograms'],
			ml: [...baseExtraUnitAliases.ml, 'milliliter', 'milliliters', 'millilitre', 'millilitres'],
			l: [...baseExtraUnitAliases.l, 'liter', 'liters', 'litre', 'litres']
		}
	},
	deu: {
		nutrientAliases: {
			...baseNutrientAliases,
			calories: [...baseNutrientAliases.calories, 'kalorien', 'energie'],
			carbohydrates: [...baseNutrientAliases.carbohydrates, 'kohlenhydrate'],
			protein: [...baseNutrientAliases.protein, 'eiweiß', 'eiweiss'],
			fat: [...baseNutrientAliases.fat, 'fett'],
			saturatedFat: [
				...baseNutrientAliases.saturatedFat,
				'gesättigte fettsäuren',
				'gesattigte fettsauren'
			],
			fiber: [...baseNutrientAliases.fiber, 'ballaststoffe'],
			sugar: [...baseNutrientAliases.sugar, 'zucker'],
			sodium: [...baseNutrientAliases.sodium, 'natrium']
		},
		perServingPhrases: ['pro portion', 'pro servierung', 'je portion'],
		ignoreTokens: [...baseIgnoreTokens, 'nährwertangaben', 'nahrwertangaben'],
		extraUnitAliases: {
			...baseExtraUnitAliases,
			kcal: [...baseExtraUnitAliases.kcal, 'kalorie', 'kalorien'],
			kj: [...baseExtraUnitAliases.kj, 'kilojoule', 'kilojoules']
		}
	},
	ita: {
		nutrientAliases: {
			...baseNutrientAliases,
			calories: [...baseNutrientAliases.calories, 'calorie', 'energia'],
			carbohydrates: [...baseNutrientAliases.carbohydrates, 'carboidrati'],
			protein: [...baseNutrientAliases.protein, 'proteine'],
			fat: [...baseNutrientAliases.fat, 'grassi'],
			saturatedFat: [...baseNutrientAliases.saturatedFat, 'grassi saturi'],
			fiber: [...baseNutrientAliases.fiber, 'fibre', 'fibra'],
			sugar: [...baseNutrientAliases.sugar, 'zuccheri'],
			sodium: [...baseNutrientAliases.sodium, 'sodio']
		},
		perServingPhrases: ['per porzione', 'a porzione', 'porzione:'],
		ignoreTokens: [...baseIgnoreTokens, 'valori nutrizionali'],
		extraUnitAliases: {
			...baseExtraUnitAliases,
			kcal: [...baseExtraUnitAliases.kcal, 'caloria', 'calorie']
		}
	},
	esp: {
		nutrientAliases: {
			...baseNutrientAliases,
			calories: [...baseNutrientAliases.calories, 'calorías', 'calorias', 'energía', 'energia'],
			carbohydrates: [...baseNutrientAliases.carbohydrates, 'carbohidratos'],
			protein: [...baseNutrientAliases.protein, 'proteína', 'proteina'],
			fat: [...baseNutrientAliases.fat, 'grasa', 'grasas'],
			saturatedFat: [...baseNutrientAliases.saturatedFat, 'grasa saturada', 'grasas saturadas'],
			fiber: [...baseNutrientAliases.fiber, 'fibra'],
			sugar: [...baseNutrientAliases.sugar, 'azúcar', 'azucar', 'azúcares', 'azucares'],
			sodium: [...baseNutrientAliases.sodium, 'sodio']
		},
		perServingPhrases: ['por porción', 'por porcion', 'por ración', 'por racion', 'porción:'],
		ignoreTokens: [...baseIgnoreTokens, 'información nutricional', 'informacion nutricional'],
		extraUnitAliases: {
			...baseExtraUnitAliases,
			kcal: [...baseExtraUnitAliases.kcal, 'caloria', 'calorías', 'calorias']
		}
	},
	fra: {
		nutrientAliases: {
			...baseNutrientAliases,
			calories: [...baseNutrientAliases.calories, 'calories', 'énergie', 'energie'],
			carbohydrates: [...baseNutrientAliases.carbohydrates, 'glucides'],
			protein: [...baseNutrientAliases.protein, 'protéines', 'proteines'],
			fat: [...baseNutrientAliases.fat, 'matières grasses', 'matieres grasses', 'lipides'],
			saturatedFat: [
				...baseNutrientAliases.saturatedFat,
				'acides gras saturés',
				'acides gras satures'
			],
			fiber: [...baseNutrientAliases.fiber, 'fibres'],
			sugar: [...baseNutrientAliases.sugar, 'sucres'],
			sodium: [...baseNutrientAliases.sodium, 'sodium']
		},
		perServingPhrases: ['par portion', 'portion:'],
		ignoreTokens: [...baseIgnoreTokens, 'valeurs nutritionnelles'],
		extraUnitAliases: {
			...baseExtraUnitAliases,
			kcal: [...baseExtraUnitAliases.kcal, 'calorie', 'calories']
		}
	},
	por: {
		nutrientAliases: {
			...baseNutrientAliases,
			calories: [...baseNutrientAliases.calories, 'calorias', 'energia'],
			carbohydrates: [...baseNutrientAliases.carbohydrates, 'carboidratos'],
			protein: [...baseNutrientAliases.protein, 'proteína', 'proteina'],
			fat: [...baseNutrientAliases.fat, 'gordura', 'gorduras'],
			saturatedFat: [...baseNutrientAliases.saturatedFat, 'gordura saturada', 'gorduras saturadas'],
			fiber: [...baseNutrientAliases.fiber, 'fibras', 'fibra'],
			sugar: [...baseNutrientAliases.sugar, 'açúcar', 'acucar', 'açúcares', 'acucares'],
			sodium: [...baseNutrientAliases.sodium, 'sódio', 'sodio']
		},
		perServingPhrases: ['por porção', 'por porcao', 'porção:'],
		ignoreTokens: [...baseIgnoreTokens, 'informação nutricional', 'informacao nutricional'],
		extraUnitAliases: {
			...baseExtraUnitAliases,
			kcal: [...baseExtraUnitAliases.kcal, 'caloria', 'calorias']
		}
	},
	ind: {
		nutrientAliases: {
			...baseNutrientAliases,
			calories: [...baseNutrientAliases.calories, 'kalori', 'energi'],
			carbohydrates: [...baseNutrientAliases.carbohydrates, 'karbohidrat'],
			protein: [...baseNutrientAliases.protein, 'protein'],
			fat: [...baseNutrientAliases.fat, 'lemak'],
			saturatedFat: [...baseNutrientAliases.saturatedFat, 'lemak jenuh'],
			fiber: [...baseNutrientAliases.fiber, 'serat'],
			sugar: [...baseNutrientAliases.sugar, 'gula'],
			sodium: [...baseNutrientAliases.sodium, 'natrium']
		},
		perServingPhrases: ['per porsi', 'per sajian', 'sajian:'],
		ignoreTokens: [...baseIgnoreTokens, 'fakta nutrisi'],
		extraUnitAliases: baseExtraUnitAliases
	},
	hin: {
		nutrientAliases: {
			...baseNutrientAliases,
			calories: [...baseNutrientAliases.calories, 'कैलोरी'],
			carbohydrates: [...baseNutrientAliases.carbohydrates, 'कार्बोहाइड्रेट'],
			protein: [...baseNutrientAliases.protein, 'प्रोटीन'],
			fat: [...baseNutrientAliases.fat, 'वसा'],
			saturatedFat: [...baseNutrientAliases.saturatedFat, 'संतृप्त वसा'],
			fiber: [...baseNutrientAliases.fiber, 'फाइबर', 'रेशा'],
			sugar: [...baseNutrientAliases.sugar, 'चीनी'],
			sodium: [...baseNutrientAliases.sodium, 'सोडियम']
		},
		perServingPhrases: ['प्रति सर्विंग', 'प्रति परोस', 'सर्विंग:'],
		ignoreTokens: [...baseIgnoreTokens, 'पोषण तथ्य'],
		extraUnitAliases: baseExtraUnitAliases
	},
	rus: {
		nutrientAliases: {
			...baseNutrientAliases,
			calories: [...baseNutrientAliases.calories, 'калории', 'энергия'],
			carbohydrates: [...baseNutrientAliases.carbohydrates, 'углеводы'],
			protein: [...baseNutrientAliases.protein, 'белки', 'белок'],
			fat: [...baseNutrientAliases.fat, 'жиры', 'жир'],
			saturatedFat: [...baseNutrientAliases.saturatedFat, 'насыщенные жиры'],
			fiber: [...baseNutrientAliases.fiber, 'клетчатка'],
			sugar: [...baseNutrientAliases.sugar, 'сахар'],
			sodium: [...baseNutrientAliases.sodium, 'натрий']
		},
		perServingPhrases: ['на порцию', 'на одну порцию', 'порция:'],
		ignoreTokens: [...baseIgnoreTokens, 'пищевая ценность'],
		extraUnitAliases: baseExtraUnitAliases
	},
	ara: {
		nutrientAliases: {
			...baseNutrientAliases,
			calories: [...baseNutrientAliases.calories, 'السعرات الحرارية', 'طاقة'],
			carbohydrates: [...baseNutrientAliases.carbohydrates, 'الكربوهيدرات'],
			protein: [...baseNutrientAliases.protein, 'بروتين'],
			fat: [...baseNutrientAliases.fat, 'دهون', 'الدهون'],
			saturatedFat: [...baseNutrientAliases.saturatedFat, 'دهون مشبعة'],
			fiber: [...baseNutrientAliases.fiber, 'ألياف', 'الياف'],
			sugar: [...baseNutrientAliases.sugar, 'سكر', 'سكريات'],
			sodium: [...baseNutrientAliases.sodium, 'صوديوم']
		},
		perServingPhrases: ['لكل حصة', 'لكل وجبة', 'الحصة:'],
		ignoreTokens: [...baseIgnoreTokens, 'حقائق غذائية'],
		extraUnitAliases: baseExtraUnitAliases
	},
	hun: {
		nutrientAliases: {
			...baseNutrientAliases,
			calories: [...baseNutrientAliases.calories, 'kalória', 'kaloria', 'energia'],
			carbohydrates: [...baseNutrientAliases.carbohydrates, 'szénhidrát', 'szenhidrat'],
			protein: [...baseNutrientAliases.protein, 'fehérje', 'feherje'],
			fat: [...baseNutrientAliases.fat, 'zsír', 'zsir'],
			saturatedFat: [...baseNutrientAliases.saturatedFat, 'telített zsír', 'telitett zsir'],
			fiber: [...baseNutrientAliases.fiber, 'rost'],
			sugar: [...baseNutrientAliases.sugar, 'cukor'],
			sodium: [...baseNutrientAliases.sodium, 'nátrium', 'natrium']
		},
		perServingPhrases: ['adagonként', 'egy adagra', 'adag:'],
		ignoreTokens: [...baseIgnoreTokens, 'tápérték', 'tapanyag'],
		extraUnitAliases: baseExtraUnitAliases
	},
	ces: {
		nutrientAliases: {
			...baseNutrientAliases,
			calories: [...baseNutrientAliases.calories, 'kalorie', 'energie'],
			carbohydrates: [...baseNutrientAliases.carbohydrates, 'sacharidy'],
			protein: [...baseNutrientAliases.protein, 'bílkoviny', 'bilkoviny'],
			fat: [...baseNutrientAliases.fat, 'tuky', 'tuk'],
			saturatedFat: [...baseNutrientAliases.saturatedFat, 'nasycené tuky', 'nasycene tuky'],
			fiber: [...baseNutrientAliases.fiber, 'vláknina', 'vlakninа'],
			sugar: [...baseNutrientAliases.sugar, 'cukr', 'cukry'],
			sodium: [...baseNutrientAliases.sodium, 'sodík', 'sodik']
		},
		perServingPhrases: ['na porci', 'na jednu porci', 'porce:'],
		ignoreTokens: [...baseIgnoreTokens, 'výživové údaje', 'vyzivove udaje'],
		extraUnitAliases: baseExtraUnitAliases
	}
}

export function getNutritionLocale(language = 'eng') {
	if (nutritionI18n[language]) {
		return nutritionI18n[language]
	}
	return nutritionI18n.eng
}

export function getNutritionLocalesWithFallback(language = 'eng') {
	const requested = getNutritionLocale(language)
	if (language === 'eng') {
		return [requested]
	}
	return [requested, nutritionI18n.eng]
}

export { nutritionI18n }
