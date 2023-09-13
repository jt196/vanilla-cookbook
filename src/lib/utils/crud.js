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
