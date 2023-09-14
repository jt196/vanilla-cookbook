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

export async function updateRecipe(formData, recipeId) {
	try {
		const response = await fetch(`/api/recipe/${recipeId}`, {
			method: 'PUT',
			body: formData // Use the FormData object directly
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

		if (response.ok) {
			const newRecipe = await response.json()
			return { success: true, data: newRecipe }
		} else {
			const errorData = await response.json()
			throw new Error(errorData.message || 'Error creating recipe')
		}
	} catch (error) {
		console.error('Error creating recipe:', error.message)
		return { success: false, error: error.message }
	}
}

export async function deletePhotoById(id) {
	if (confirm('Are you sure you want to delete this photo?')) {
		try {
			const response = await fetch(`/api/recipe/images/${id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Error deleting photo')
			}

			return true
		} catch (error) {
			console.error('Error deleting photo:', error.message)
			return false
		}
	}
}
