// Import necessary modules and functions

import { convertIngredientsBackend } from '$lib/utils/converterBackend.js'

export const POST = async ({ request }) => {
	try {
		// Parse JSON data from the request body
		const requestBody = await request.json()
		console.log(
			'🚀 ~ file: +server.js:9 ~ POST ~ requestBody.skipSmallUnits:',
			requestBody.skipSmallUnits
		)

		// Manipulate the JSON data (e.g., using convertIngredientsBackend)
		const manipulatedData = await convertIngredientsBackend(
			requestBody.ingredients,
			requestBody.fromSystem,
			requestBody.toSystem,
			requestBody.skipSmallUnits
		)

		// Return the manipulated data as a JSON response
		return new Response(JSON.stringify(manipulatedData), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	} catch (error) {
		// Handle errors and return an appropriate response
		return new Response(JSON.stringify({ error: error.message }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		})
	}
}
