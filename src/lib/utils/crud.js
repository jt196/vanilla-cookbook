// deleteHelper.js
export async function deleteRecipeById(uid) {
	if (confirm('Are you sure you want to delete this recipe?')) {
		try {
			const response = await fetch(`/api/recipe/${uid}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Error deleting recipe')
			}

			return true
		} catch (error) {
			console.error('Error deleting recipe:', error.message)
			return false
		}
	}
}

export async function updateRecipe(recipe) {
	try {
		const response = await fetch(`/api/recipe/${recipe.uid}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(recipe)
		})

		if (response.ok) {
			const updatedRecipe = await response.json()
			return { success: true, data: updatedRecipe }
		} else {
			const errorData = await response.json()
			throw new Error(errorData.message || 'Error updating recipe')
		}
	} catch (error) {
		console.error('Error updating recipe:', error.message)
		return { success: false, error: error.message }
	}
}

export async function createRecipe(recipe) {
	try {
		const response = await fetch(`/api/recipe`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(recipe)
		})

		console.log('🚀 ~ file: crud.js:52 ~ createRecipe ~ response:', response)
		if (response.ok) {
			const newRecipe = await response.json()
			console.log('🚀 ~ file: crud.js:60 ~ createRecipe ~ newRecipe:', newRecipe)
			return { success: true, data: newRecipe }
		} else {
			const errorData = await response.json()
			console.log('🚀 ~ file: crud.js:64 ~ createRecipe ~ errorData.message:', errorData.message)
			throw new Error(errorData.message || 'Error creating recipe')
		}
	} catch (error) {
		console.error('Error creating recipe:', error.message)
		return { success: false, error: error.message }
	}
}
