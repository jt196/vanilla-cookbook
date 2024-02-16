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
			const response = await fetch(`/api/recipe/image/${id}`, {
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

// Send a list of one or more photos to the backend to update
export async function updatePhotos(photos) {
	try {
		const response = await fetch('/api/recipe/images', {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(photos)
		})

		if (!response.ok) {
			const errorData = await response.json()
			throw new Error(errorData.message || 'Error updating photos')
		}

		return true
	} catch (error) {
		console.error('Error updating photos:', error.message)
		return false
	}
}

export async function importFileExists(filename) {
	const response = await fetch('/api/import/paprika/file', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ filename })
	})

	const result = await response.json()
	return result.exists
}

export async function uploadPaprikaFile(formData) {
	try {
		const response = await fetch(`/api/import/paprika/paprikarecipes`, {
			method: 'PUT',
			body: formData
		})
		const responseData = await response.json()
		if (response.ok) {
			// Assuming the server responds with a success message
			return { success: true, message: responseData.success }
		} else {
			// Extracting error message from the server's response
			throw new Error(responseData.error || 'Error uploading file')
		}
	} catch (error) {
		console.error('Error uploading Paprika file:', error.message)
		return { success: false, message: error.message }
	}
}

export async function dbCatCount(userId) {
	let dbCategoryCount = 0
	try {
		const response = await fetch(`/api/user/${userId}/categories/count`)
		const data = await response.json()

		if (data && data.count) {
			dbCategoryCount = data.count
		}
	} catch (err) {
		console.error('Error fetching category db count:', err)
	}
	return dbCategoryCount
}

export async function dbRecCount(userId) {
	// Fetch the category count for the user
	let dbRecCount = 0
	try {
		const response = await fetch(`/api/user/${userId}/recipes/count`)
		const data = await response.json()
		if (data && data.count) {
			dbRecCount = data.count
		}
	} catch (err) {
		console.error('Error fetching recipe db count:', err)
	}
	return dbRecCount
}

export async function fileCatCount() {
	let fileCategoryCount = 0
	try {
		const response = await fetch(`/api/import/paprika/categories`)
		const data = await response.json()
		if (data && data.fileCount) {
			fileCategoryCount = data.fileCount
		}
	} catch (err) {
		console.error('Error fetching category file count:', err)
	}
	return fileCategoryCount
}

/**
 * Retrieves the file record count by making an asynchronous request to the
 * specified API endpoint. If successful, it returns the file record count;
 * otherwise, it logs an error message and returns 0.
 *
 * @return {number} The file record count
 */
export async function fileRecCount() {
	let fileRecCount = 0
	try {
		const response = await fetch(`/api/import/paprika/recipes`)
		const data = await response.json()
		if (data && data.fileCount) {
			fileRecCount = data.fileCount
		}
	} catch (err) {
		console.error('Error fetching category file count:', err)
	}
	return fileRecCount
}

export async function addIngredientToShoppingList(ingredient) {
	try {
		const response = await fetch(`/api/ingredients/shopping`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(ingredient)
		})

		if (response.ok) {
			const newShoppingListItem = await response.json()
			return { success: true, data: newShoppingListItem }
		} else {
			const errorData = await response.json()
			throw new Error(errorData.message || 'Error creating shopping list item')
		}
	} catch (error) {
		console.error('Error creating shopping list item:', error.message)
		return { success: false, error: error.message }
	}
}

export async function updateShoppingListItem(item) {
	try {
		const response = await fetch(`/api/ingredients/shopping`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(item)
		})
		if (!response.ok) {
			const errorData = await response.json()
			throw new Error(errorData.message || 'Error updating shopping list item')
		}
		return await response.json()
	} catch (error) {
		console.error('Error updating shopping list item:', error.message)
		throw error // Rethrow the error if you want to handle it in the calling component (e.g., to show an error message)
	}
}

export async function deletePurchasedItems() {
	try {
		const response = await fetch(`/api/ingredients/shopping/items`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		})

		if (!response.ok) {
			// If the response is not OK and not 204, attempt to read and parse the response body
			if (response.status !== 204 && response.headers.get('Content-Length') !== '0') {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Error deleting purchased items')
			} else {
				// Handle other error scenarios appropriately
				throw new Error('Error deleting purchased items: No response body')
			}
		}

		// For a 204 No Content response, there's no need to parse the response body, just return a success indicator
		if (response.status === 204) {
			return { success: true }
		} else if (response.headers.get('Content-Length') !== '0') {
			// If there's content, parse and return it
			return await response.json()
		} else {
			// If there's no content but the status is not 204, handle as needed
			return null
		}
	} catch (error) {
		console.error('Error deleting purchased items:', error.message)
		throw error // Rethrow the error if you want to handle it in the calling component
	}
}

export async function markPurchasedItems() {
	try {
		const response = await fetch(`/api/ingredients/shopping/items`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json'
			}
		})

		if (!response.ok) {
			// If the response is not OK and not 204, attempt to read and parse the response body
			if (response.status !== 204 && response.headers.get('Content-Length') !== '0') {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Error marking items purchased')
			} else {
				// Handle other error scenarios appropriately
				throw new Error('Error marking items purchased: No response body')
			}
		}

		// For a 204 No Content response, there's no need to parse the response body, just return a success indicator
		if (response.status === 204) {
			return { success: true }
		} else if (response.headers.get('Content-Length') !== '0') {
			// If there's content, parse and return it
			return await response.json()
		} else {
			// If there's no content but the status is not 204, handle as needed
			return null
		}
	} catch (error) {
		console.error('Error marking items purchased:', error.message)
		throw error // Rethrow the error if you want to handle it in the calling component
	}
}

export async function deleteShoppingListItem(uid) {
	try {
		const response = await fetch(`/api/ingredients/shopping/${uid}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		})

		if (!response.ok) {
			// If the response is not OK and not 204, attempt to read and parse the response body
			if (response.status !== 204 && response.headers.get('Content-Length') !== '0') {
				const errorData = await response.json()
				throw new Error(errorData.message || 'Error deleting shopping list item')
			} else {
				// Handle other error scenarios appropriately
				throw new Error('Error deleting shopping list item: No response body')
			}
		}

		// For a 204 No Content response, there's no need to parse the response body, just return a success indicator
		if (response.status === 204) {
			return { success: true }
		} else if (response.headers.get('Content-Length') !== '0') {
			// If there's content, parse and return it
			return await response.json()
		} else {
			// If there's no content but the status is not 204, handle as needed
			return null
		}
	} catch (error) {
		console.error('Error deleting shopping list item:', error.message)
		throw error // Rethrow the error if you want to handle it in the calling component
	}
}

export async function addRecipeLog(recipeUid) {
	console.log('🚀 ~ addRecipeLog ~ recipeUid:', recipeUid)
	try {
		const response = await fetch(`/api/recipe/${recipeUid}/log`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		})

		if (response.ok) {
			const newRecipeLog = await response.json()
			return { success: true, data: newRecipeLog }
		} else {
			const errorData = await response.json()
			throw new Error(errorData.message || 'Error creating recipe log')
		}
	} catch (error) {
		console.error('Error creating recipe log:', error.message)
		return { success: false, error: error.message }
	}
}

export async function updateEventInBackend(id, start, end, userId) {
	try {
		// Replace with your actual API call to update the event
		const response = await fetch(`/api/log/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ start, end, userId })
		})

		if (!response.ok) {
			throw new Error('Network response was not ok')
		}

		// Handle success - maybe refresh the calendar or show a notification
	} catch (error) {
		console.error('Error updating event:', error)
		// Handle error - maybe show an error notification
	}
}

export async function deleteEventInBackend(id) {
	try {
		// Replace with your actual API call to update the event
		const response = await fetch(`/api/log/${id}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json'
			}
		})

		if (!response.ok) {
			throw new Error('Network response was not ok')
		}

		// Handle success - maybe refresh the calendar or show a notification
	} catch (error) {
		console.error('Error deleting event:', error)
		// Handle error - maybe show an error notification
	}
}
