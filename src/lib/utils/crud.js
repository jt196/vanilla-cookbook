// deleteHelper.js

/**
 * Deletes a recipe by its unique identifier.
 *
 * @param {number|string} uid - Unique identifier for the recipe to be deleted.
 * @returns {Promise<boolean>} A promise that resolves to true if the recipe was deleted successfully, or false if not.
 */
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

/**
 * Adds a recipe to the user's favourites.
 *
 * @param {number|string} uid - Unique identifier for the recipe to be added.
 * @returns {Promise<boolean>} A promise that resolves to true if the recipe was added to favourites successfully, or false if not.
 */
export async function addRecipeToFavourites(uid) {
	try {
		const response = await fetch(`/api/recipe/${uid}/favourite`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json'
			}
		})

		if (!response.ok) {
			const errorData = await response.json()
			throw new Error(errorData.message || 'Error favouriting recipe')
		}

		return true
	} catch (error) {
		console.error('Error favouriting recipe:', error.message)
		return false
	}
}

/**
 * Updates the rating of a recipe on the server.
 *
 * @param {number} newRating - The new rating to be set, between 1 and 5.
 * @param {number|string} uid - Unique identifier for the recipe to be updated.
 *
 * @returns {Promise<void>} A promise that resolves if the update was successful. If not, the promise is rejected.
 */
export async function recipeRatingChange(newRating, uid) {
	// Now call the endpoint
	const response = await fetch(`/api/recipe/${uid}/rating`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ rating: newRating })
	})
	if (!response.ok) {
		// Handle error (e.g. revert UI change, show message, etc.)
		console.error('Failed to update rating')
	}
}

/**
 * Updates an existing recipe on the server.
 *
 * @param {FormData} formData - The form data containing the updated recipe information.
 * @param {number|string} recipeId - Unique identifier for the recipe to be updated.
 * @returns {Promise<Object>} A promise that resolves to an object indicating success or failure.
 *   If successful, the object contains the updated recipe data under the `data` property.
 *   If unsuccessful, the object contains an error message under the `error` property.
 */
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

/**
 * Creates a new recipe on the server.
 *
 * @param {Object} recipe - The new recipe information, with the following properties:
 *   - name: string
 *   - source: string
 *   - source_url: string
 *   - cook_time: string
 *   - image_url: string
 *   - prep_time: string
 *   - ingredients: string
 *   - directions: string
 *   - total_time: string
 *   - servings: string
 *   - nutritional_info: string
 * @returns {Promise<Object>} A promise that resolves to an object indicating success or failure.
 *   If successful, the object contains the newly created recipe data under the `data` property.
 *   If unsuccessful, the object contains an error message under the `error` property.
 */
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

/**
 * Deletes a single photo by its unique identifier.
 * @param {number|string} id - The unique identifier of the photo to be deleted.
 * @returns {Promise<boolean>} A promise that resolves to true if the photo was deleted successfully, or false if not.
 */
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

/**
 * Updates one or more photos for a recipe on the server.
 *
 * @param {Array<Object>} photos - An array of objects with the following properties:
 *   - id: number|string - The unique identifier for the photo to be updated.
 *   - notes: string - The new notes for the photo.
 *   - isMain: boolean - Whether the photo should be set as the main photo.
 *
 * @returns {Promise<boolean>} A promise that resolves to true if the photos were updated successfully, or false if not.
 */
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

/**
 * Checks if a file exists in the /uploads/import directory.
 *
 * @param {string} filename - The name of the file to look for.
 * @returns {Promise<boolean>} A promise that resolves to true if the file exists, or false if not.
 */
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

/**
 * Uploads a .paprikarecipes zip file to the server.
 *
 * @param {FormData} formData - A FormData object containing the file to be uploaded.
 * @returns {Promise<Object>} A promise that resolves to an object with the following properties:
 *   - `success`: A boolean indicating whether the upload was successful.
 *   - `message`: A string containing an error message if the upload failed, or a success message if the upload succeeded.
 */
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

/**
 * Fetches the count of categories from the database for a given user.
 *
 * @param {string|number} userId - The unique identifier of the user whose categories are being counted.
 * @returns {Promise<number>} A promise that resolves to the number of categories in the user's database.
 *   If an error occurs during the fetch operation, it returns 0.
 */
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

/**
 * Fetches the count of recipes from the database for a given user.
 *
 * @param {string|number} userId - The unique identifier of the user whose recipes are being counted.
 * @returns {Promise<number>} A promise that resolves to the number of recipes in the user's database.
 *   If an error occurs during the fetch operation, it returns 0.
 */
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

/**
 * Retrieves the file category count by making an asynchronous request to the
 * specified API endpoint. If successful, it returns the file category count;
 * otherwise, it logs an error message and returns 0.
 *
 * @return {number} The file category count
 */
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

/**
 * Adds a new ingredient to the user's shopping list by making an asynchronous
 * POST request to the /api/ingredients/shopping API endpoint. If successful, it
 * returns an object with a success flag and the newly created shopping list
 * item's data; otherwise, it logs an error message and returns an object with
 * a success flag and an error message.
 *
 * @param {object} ingredient The ingredient object to add to the shopping list
 * @return {object} An object with a success flag and either the newly created
 *                  shopping list item's data or an error message
 */
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

/**
 * Updates an existing shopping list item by sending a PATCH request to the
 * /api/ingredients/shopping endpoint. If the update is successful, it returns
 * the updated item data. If the request fails, it throws an error with a
 * relevant message.
 *
 * @param {object} item - The shopping list item object to update, containing
 * the necessary properties like uid, name, quantity, etc.
 * @returns {Promise<object>} A promise that resolves to the updated shopping
 * list item data.
 * @throws {Error} If the request fails or the server responds with an error.
 */
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

/**
 * Deletes all purchased items from the user's shopping list by making a DELETE
 * request to the /api/ingredients/shopping/items endpoint. If successful, it
 * returns an object with a success flag; otherwise, it logs an error message
 * and rethrows the error.
 *
 * @return {Promise<object>} A promise that resolves to an object with a success
 *                  flag or an error message.
 * @throws {Error} If the request fails or the server responds with an error.
 */
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

/**
 * Marks all unchecked items in the user's shopping list as purchased by making a PATCH
 * request to the /api/ingredients/shopping/items endpoint. If successful, it returns
 * an object with a success flag; otherwise, it logs an error message and rethrows the
 * error.
 *
 * @return {Promise<object>} A promise that resolves to an object with a success
 *                  flag or an error message.
 * @throws {Error} If the request fails or the server responds with an error.
 */
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

/**
 * Deletes a single shopping list item from the user's shopping list by making a DELETE
 * request to the /api/ingredients/shopping/:uid endpoint. If successful, it returns
 * an object with a success flag; otherwise, it logs an error message and rethrows the
 * error.
 *
 * @param {string} uid The unique identifier for the shopping list item to delete.
 * @return {Promise<object>} A promise that resolves to an object with a success
 *                  flag or an error message.
 * @throws {Error} If the request fails or the server responds with an error.
 */
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

/**
 * Creates a new recipe log entry for the given recipe by making a POST request
 * to the /api/recipe/:recipeUid/log endpoint. If successful, it returns an
 * object with a success flag and the newly created recipe log entry's data;
 * otherwise, it logs an error message and returns an object with a success
 * flag and an error message.
 *
 * @param {string} recipeUid The unique identifier for the recipe to log.
 * @return {Promise<object>} A promise that resolves to an object with a success
 *                  flag and either the newly created recipe log entry's data
 *                  or an error message.
 * @throws {Error} If the request fails or the server responds with an error.
 */
export async function addRecipeLog(recipeUid) {
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

/**
 * Updates a recipe log entry for the given event by making a PUT request to the
 * /api/log/:id endpoint. If successful, it does not return anything; otherwise,
 * it logs an error message and throws an error.
 *
 * @param {number} id The unique identifier for the recipe log entry to update.
 * @param {Date|string} start The new start time for the recipe log entry.
 * @param {Date|string} end The new end time for the recipe log entry.
 * @param {number} userId The user ID to associate with the recipe log entry.
 * @throws {Error} If the request fails or the server responds with an error.
 */
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

/**
 * Deletes a recipe log entry for the given event by making a DELETE request to the
 * /api/log/:id endpoint. If successful, it does not return anything; otherwise,
 * it logs an error message and throws an error.
 *
 * @param {number} id The unique identifier for the recipe log entry to delete.
 * @throws {Error} If the request fails or the server responds with an error.
 */
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
