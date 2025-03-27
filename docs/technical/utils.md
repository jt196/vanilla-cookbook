# Utility Functions

## security.js
### validatePassword
Validate a password to ensure it meets the security requirements.

@param {string} password
{% raw %}
@returns {{ isValid: boolean, message: string }}
{% endraw %}


## converterBackend.js
### getAllIngredientData
Retrieves all ingredient data from the database.


@returns {Promise<Object[]>} A promise that resolves to an array of ingredient objects from the database.

### convertIngredientsBackend
Converts a list of ingredients from one measurement system to another.

Uses fuzzy matching (via Fuse.js) against ingredient data stored in the database
to assist in identifying appropriate conversion logic. Can optionally skip
conversion of small units (e.g. "pinch", "dash") if specified.


@param {Object[]} ingredients - An array of ingredient objects to convert.
@param {string} fromSystem - The measurement system to convert from (e.g., 'metric').
@param {string} toSystem - The measurement system to convert to (e.g., 'imperial').
@param {boolean} [skipSmallUnits=false] - Whether to skip conversion of small units like 'pinch' or 'dash'.
@returns {Promise<Object[]>} A promise that resolves to the array of converted ingredient objects.


## ai.js
### gptExtractRecipeFromContent
Extracts a recipe from the provided content using the OpenAI API.


@param {string} content - The input content containing the recipe in HTML or plain text.
@param {string} [type='html'] - The type of the content, either 'html' or 'text'.
@param {string} [url=''] - The URL where the content originated, used only for HTML content.
@returns {Promise<Object>} A promise that resolves to an object representing the extracted recipe.
@throws {Error} Throws an error if the OpenAI API is disabled, the API key is missing, or if the content parsing fails.


## categories.js
### buildHierarchy
Builds a hierarchical structure from a flat list of categories.
This is used for taking a user's categories and building a structure from them
They're stored in a flat structure in the DB


@param {Array} categories - An array of category objects with uid, parent_uid, and other properties.
@returns {Array} An array of root categories, each with a nested structure of children.

### transformToNodes
Transforms a hierarchical category structure into a format suitable for svelte-dnd-action.


@param {Array} categories - An array of hierarchical category objects.
@returns {Object} An object of nodes, each representing a category.

### wrapTopLevelNodes
Wraps all top-level nodes in an outer node.


@param {Object} data - An object of nodes, each representing a category.
@returns {Object} The input data with all top-level nodes wrapped in an outer node.

### fetchAndTransformCategories
Fetches categories for a user and transforms them into a suitable format.


@param {Function} fetch - The fetch function to use.
@param {URL} url - The base URL to fetch from.
@param {string} userId - The ID of the user whose categories to fetch.
@returns {Promise<Object>} An object of nodes, each representing a category.

### sortItemsAlphabetically
Sorts the items in each node alphabetically by name.


@param {Object} nodes - An object of nodes, each representing a category.
@returns {Object} The input nodes with items sorted alphabetically.

### collectSelectedUids
Collects the UIDs of all selected categories from a hierarchical structure.


@param {Array} categories - An array of hierarchical category objects.
@returns {Array<string>} An array of UIDs of selected categories.


## sorting.js
### sortRecipesByKey
Sorts an array of recipes by a given key.

@param {Object[]} recipes - Array of recipes to sort.
@param {string} key - The key by which to sort the recipes.
@param {string} [currentSort] - The current sort direction ('asc' or 'desc').
{% raw %}
@returns {{sortedRecipes: Object[], newSort: string}} - An object containing the sorted recipes and the new sort direction.
{% endraw %}

### sortByKeyGeneric
Sorts an array by a given key in either ascending or descending order.

@param {Object[]} inputArray - Array of objects to sort.
@param {string} inputKey - The key by which to sort the array.
@param {string} direction - The sort direction ('asc' or 'desc').
@returns {Object[]} - The sorted array.

### sortByTwoKeys
Sorts an array of objects by two keys, with specified sort directions for each key.
The array is first sorted by the `primarySortKey` in the specified `primaryDirection`.
If two elements have the same value for the `primarySortKey`, they are then sorted
by the `secondarySortKey` in the specified `secondaryDirection`.


@param {Object[]} inputArray - The array of objects to sort.
@param {string} primarySortKey - The key to sort the array by initially.
@param {string} secondarySortKey - The key to sort the array by when the primary key values are equal.
@param {string} [primaryDirection='asc'] - The sort direction for the primary key ('asc' or 'desc').
@param {string} [secondaryDirection='asc'] - The sort direction for the secondary key ('asc' or 'desc').
@returns {Object[]} - The array sorted by the specified primary and secondary keys.

### sortByDate
Sorts an array by a date key in either ascending or descending order.

@param {Object[]} inputArray - Array of objects to sort.
@param {string} dateKey - The date key by which to sort the array.
@param {string} direction - The sort direction ('asc' or 'desc').
@returns {Object[]} - The sorted array.

### randomSortArray
Sorts the input array randomly.


@param {stringDateRecord[]} inputArray - Array of records to sort.
@returns {stringDateRecord[]} - Randomly sorted array.

### sortByNameRecursive
Recursively sorts an array of objects by their 'name' property.

@param {Object[]} data - Array of objects to sort.
@returns {Object[]} - The sorted array.


## dryIngredientsConversion.js
### dryIngredientsConversion
List of weights for 1 cup of different dried ingredients
The names uses an array so can be for multiple names of an ingredient

@type {Object}


## converter.js
### converter
Converts a quantity from one unit to another.


@param {number} quantity - The quantity of the 'from' unit.
@param {string} from - The original unit to be converted.
@param {string} [to='grams'] - The unit to be converted to.
{% raw %}
@returns {{quantity: number, unit: string} | {error: string}} - Returns an object containing either the converted quantity and unit or an error message.
{% endraw %}

### determineSystem
Determines the dominant measurement system used in an array of ingredients.


@param {Array} ingredientArray - An array of ingredient objects.
{% raw %}
@returns {{system: string, counts: Object}} - The dominant system and the counts of each system.
{% endraw %}

### systemToUnitsMap
Mapping of measurement systems to their respective units.

@type {Object}

### measurementSystems
Manipulates an ingredient object to convert its quantity and unit from one system to another.


@param {Object} ingredientObj - The ingredient object to be manipulated.
@param {string} fromSystem - The original measurement system.
@param {string} toSystem - The target measurement system.
@returns {Object} - The manipulated ingredient object with converted quantity and unit.

### Function 5
Attempts to find a match for an ingredient in a lookup table.
This was used in the manipulate ingredients function before I transitioned to the database version


@param {string} ingredient - The ingredient name to match.
@param {Array} lookupTable - The table of ingredients to search within.
@returns {Object|null} - Returns the matched ingredient object or null if no match is found.

### normalizeIngredient
Normalizes an ingredient object by standardizing units, rounding quantity, and adding metadata.

@param {Object} ingredientObj - The original ingredient object.
@param {Object} options - Optional settings.
@param {boolean} options.skipRounding - If true, skip rounding quantity.
@returns {Object} - Normalized ingredient object.

### manipulateIngredient
Manipulates an ingredient object to convert its quantity and unit from one system to another.


@param {Object} ingredientObj - The ingredient object to be manipulated.
@param {string} fromSystem - The original measurement system.
@param {string} toSystem - The target measurement system.
@returns {Object} - The manipulated ingredient object with converted quantity and unit.

### parseRecipeText
Converts temperatures in an array of direction strings from one system to another.

This function iterates over each direction in the array and converts any temperatures
found within each direction from the original system to the target system using the
`parseTemperature` function.

Accepted values: 'metric', 'imperial', 'americanVolumetric'.
Accepted values: 'metric', 'imperial'.


parseRecipeText(["Preheat oven to 350°F", "Bake at 180C"], "metric", "imperial");
// Returns: ["Preheat oven to 176°C", "Bake at 356°F"]


@param {string[]} directions - An array of direction strings containing temperature values to be converted.
@param {string} toSystem - The target temperature system for conversion.
@param {string} fromSystem - The original temperature system of the values in the direction strings.
@returns {string[]} - An array of direction strings with temperatures converted to the target system.
@example

### parseTemperature
Converts temperatures in a given string from one system to another.

The function identifies temperatures in Celsius, Fahrenheit, and generic "degrees" format.
It supports both single values and ranges (e.g., "70C", "70 to 80 degrees F").
Conversion is based on the specified source and target system.

Note: 'americanVolumetric' is treated as a subtype of 'imperial'.


parseTemperature("Preheat oven to 350°F", "metric", "imperial");
// => "Preheat oven to **176°C**"

parseTemperature("Set water to 70 to 80 degrees C", "imperial", "metric");
// => "Set water to **158-176°F**"

@param {string} direction - The input string containing temperature values.
@param {string} toSystem - The target system: 'metric', 'imperial', or 'americanVolumetric'.
@param {string} fromSystem - The source system: 'metric' or 'imperial'.
@returns {string} - The string with converted temperatures, wrapped in `**`, or original if no conversion needed.
@example


## wakeLock.js
### requestWakeLock
Requests a Wake Lock from the browser, which keeps the screen awake while the document is visible.
If the Wake Lock API is not supported, logs a warning to the console.


@returns {Promise<void>}

### releaseWakeLock
Releases the Wake Lock if it is currently held, allowing the screen to turn off.
Logs a message to the console when the Wake Lock is released.
If the Wake Lock is not held or the environment is not a browser, the function returns immediately.


@returns {Promise<void>}

### handleVisibilityChange
Handles changes in the document's visibility state.
Requests a Wake Lock when the document becomes visible,
and releases it when the document is hidden.
Logs the current visibility state to the console.

### setupWakeLock
Sets up the Wake Lock.
If the environment is not a browser, the function returns immediately.
Requests a Wake Lock and listens for visibility changes on the document.
Logs a message to the console when the function is called.

### cleanupWakeLock
Releases the Wake Lock and removes the event listener for visibility changes on the document.
This function is called when the Svelte app is being torn down, to release any held resources.
If the environment is not a browser, the function returns immediately.


## render.js
### getSanitizedHTML
Takes Markdown content and returns sanitized HTML.

Server-side rendering is done using `sanitize-html` while client-side rendering
is done using `DOMPurify`.


@param {string} content - Markdown content to be sanitized and rendered as HTML.
@returns {Promise<string>} Sanitized HTML content.


## units.js
### units
Represents an array of unit objects.

@type {Object[]}
@property {string[]} names - Different names for a given unit.
@property {number} grams - The gram equivalent of the unit.
@property {boolean} skipConversion - Whether to skip conversion, often used for volumetric units like teaspoons.
@property {number} decimalPlaces - Number of decimal places for display.

### shouldSkipConversion
Determines if a unit should skip conversion based on its name.

@param {string} unit - The name of the unit.
@returns {boolean} - Returns true if the unit should skip conversion, otherwise false.

### findSuitableUnit
Finds a suitable unit for a given system and quantity in grams.

@param {string} system - The system to use ('imperial', 'metric', or 'americanVolumetric').
@param {number} quantityInGrams - The quantity in grams.
@returns {string} - The name of the suitable unit.


## config.js
### systems
Supported measurement systems for recipe data.
Each system includes a machine-readable value and a user-friendly label.


{% raw %}
@type {{ value: string, label: string }[]}
{% endraw %}

### languages
Supported languages for the application.
Each language includes a language code and its display label.


{% raw %}
@type {{ value: string, label: string }[]}
{% endraw %}

### defaultRecipe
Default structure for a recipe object.
Used to initialize empty recipe forms or reset state.

name: string,
source: string,
source_url: string,
cook_time: string,
image_url: string,
prep_time: string,
ingredients: string,
directions: string,
total_time: string,
servings: string,
nutritional_info: string
}}

{% raw %}
@type {{
{% endraw %}


## dateTime.js
### localDateAndTime
Accepts date objects or strings and returns a string in local date and time format.

@param {(string|Date|null)} dateTime - A date object, date string, or null.
@returns {string} - The local date and time in string format.

### localDate
Takes a dateTime parameter and returns the local date.


@param {any} dateTime - the date and time input
@return {string} the local date

### getIsoDateTimeString
Returns the current datetime in ISO 8601 format.

@returns {string} - The current datetime in ISO 8601 format.

### stringToISOString
Parse a date string and convert it to ISO format.

@param {string} dateString - The date string to be parsed.
@returns {string} - The ISO format of the parsed date string.

### convertToMinutes
Convert a text input into minutes.

@param {string} input - The input string containing duration in text format.
@returns {(number|null)} - The total number of minutes represented by the input string, or null if parsing failed.

### convertMinutesToTime
Convert a number of minutes into a readable string.

@param {number} minutes - The total number of minutes.
@returns {string} - The duration in a readable string format.


## filters.js
### filterSearch
Filters data based on a search string and a key.


@param {string | null} searchString - The search string.
@param {IGenericRecord[]} data - An array of data to search through.
@param {string} key - The key in the data objects to search against.
@returns {IGenericRecord[]} - The filtered array.

### ingredientProcess
Processes an array of ingredient strings to return parsed ingredient objects.


@param {string[]} ingredientArray - The ingredient strings to process.
@returns {parsedIngredient[]} - An array of parsed ingredient objects.

### sanitizeIngredient
Sanitize a string for YAML front matter.

@param {string} str - The input string to sanitize.
@returns {string} The sanitized string.

### scaleNumbersInString
Scales numbers within a string by a specified factor. This includes whole numbers, fractions, Unicode fractions,
decimal numbers, and combinations of whole numbers and fractions (with or without space).


@param {string} str - The string with numbers to scale.
@param {number} scale - The factor to scale numbers by.
@returns {string} - The string with scaled numbers.

### convertToDecimal
Converts a fraction string or a whole number plus fraction string to a decimal.

@param {string} str - The string to convert, which can be a simple fraction or a whole number plus fraction.
@returns {number} The decimal equivalent of the input.

### decimalToFraction
Converts a decimal number to its fraction representation, if possible.


@param {number} decimal - The decimal number to convert.
@returns {string | number} - The fraction representation or original number.

### roundIngredientQuantity
Rounds an ingredient quantity to the nearest whole number if greater than 10,
or to one decimal place if 10 or less.


@param {number} decimal - The decimal quantity to round.
@returns {number} - The rounded quantity.

### roundToDecimalPlaces
Rounds a number to a specified number of decimal places.


roundToDecimalPlaces(123.4567, 2); // returns 123.46

@function
@param {number} num - The number to be rounded.
@param {number} decimalPlaces - The number of decimal places to round to.
@returns {number} - The rounded number.
@example

### roundToTolerance
Rounds a number to the nearest integer if it's within a specified tolerance.


roundToTolerance(123.00000000001); // returns 123
roundToTolerance(123.0001, 0.001); // returns 123

@function
@param {number} num - The number to be checked and potentially rounded.
@param {number} [tolerance=1e-10] - The tolerance within which the number will be rounded to the nearest integer.
@returns {number} - The original number or its rounded value if it's within the tolerance.
@example

### unicodeToAscii
Converts unicode characters in a string to their ASCII representation.


@param {string} str - The string to convert.
@returns {string} - The string with unicode characters converted to ASCII.

### decodeHTMLEntities
Decodes HTML entities in a string.


@param {string} str - The string with HTML entities.
@returns {string} - The decoded string.

### startsWithHttp
Checks if a string starts with "http".


@param {string} str - The string to check.
@returns {boolean} - True if the string starts with "http", otherwise false.

### nutritionProcess
Processes a nutrition object and converts it to a readable string.


@param {object} nutritionObject - The nutrition object to process.
@returns {string} - A string representation of the nutrition object.


## crud.js
### deleteRecipeById
Deletes a recipe by its unique identifier.


@param {number|string} uid - Unique identifier for the recipe to be deleted.
@returns {Promise<boolean>} A promise that resolves to true if the recipe was deleted successfully, or false if not.

### addRecipeToFavourites
Adds a recipe to the user's favourites.


@param {number|string} uid - Unique identifier for the recipe to be added.
@returns {Promise<boolean>} A promise that resolves to true if the recipe was added to favourites successfully, or false if not.

### recipeRatingChange
Updates the rating of a recipe on the server.



@param {number} newRating - The new rating to be set, between 1 and 5.
@param {number|string} uid - Unique identifier for the recipe to be updated.
@returns {Promise<void>} A promise that resolves if the update was successful. If not, the promise is rejected.

### updateRecipe
Updates an existing recipe on the server.

If successful, the object contains the updated recipe data under the `data` property.
If unsuccessful, the object contains an error message under the `error` property.

@param {FormData} formData - The form data containing the updated recipe information.
@param {number|string} recipeId - Unique identifier for the recipe to be updated.
@returns {Promise<Object>} A promise that resolves to an object indicating success or failure.

### createRecipe
Creates a new recipe on the server.

- name: string
- source: string
- source_url: string
- cook_time: string
- image_url: string
- prep_time: string
- ingredients: string
- directions: string
- total_time: string
- servings: string
- nutritional_info: string
If successful, the object contains the newly created recipe data under the `data` property.
If unsuccessful, the object contains an error message under the `error` property.

@param {Object} recipe - The new recipe information, with the following properties:
@returns {Promise<Object>} A promise that resolves to an object indicating success or failure.

### deletePhotoById
Deletes a single photo by its unique identifier.

@param {number|string} id - The unique identifier of the photo to be deleted.
@returns {Promise<boolean>} A promise that resolves to true if the photo was deleted successfully, or false if not.

### updatePhotos
Updates one or more photos for a recipe on the server.

- id: number|string - The unique identifier for the photo to be updated.
- notes: string - The new notes for the photo.
- isMain: boolean - Whether the photo should be set as the main photo.


@param {Array<Object>} photos - An array of objects with the following properties:
@returns {Promise<boolean>} A promise that resolves to true if the photos were updated successfully, or false if not.

### importFileExists
Checks if a file exists in the /uploads/import directory.


@param {string} filename - The name of the file to look for.
@returns {Promise<boolean>} A promise that resolves to true if the file exists, or false if not.

### uploadPaprikaFile
Uploads a .paprikarecipes zip file to the server.

- `success`: A boolean indicating whether the upload was successful.
- `message`: A string containing an error message if the upload failed, or a success message if the upload succeeded.

@param {FormData} formData - A FormData object containing the file to be uploaded.
@returns {Promise<Object>} A promise that resolves to an object with the following properties:

### dbCatCount
Fetches the count of categories from the database for a given user.

If an error occurs during the fetch operation, it returns 0.

@param {string|number} userId - The unique identifier of the user whose categories are being counted.
@returns {Promise<number>} A promise that resolves to the number of categories in the user's database.

### dbRecCount
Fetches the count of recipes from the database for a given user.

If an error occurs during the fetch operation, it returns 0.

@param {string|number} userId - The unique identifier of the user whose recipes are being counted.
@returns {Promise<number>} A promise that resolves to the number of recipes in the user's database.

### fileCatCount
Retrieves the file category count by making an asynchronous request to the
specified API endpoint. If successful, it returns the file category count;
otherwise, it logs an error message and returns 0.


@return {number} The file category count

### fileRecCount
Retrieves the file record count by making an asynchronous request to the
specified API endpoint. If successful, it returns the file record count;
otherwise, it logs an error message and returns 0.


@return {number} The file record count

### addIngredientToShoppingList
Adds a new ingredient to the user's shopping list by making an asynchronous
POST request to the /api/ingredients/shopping API endpoint. If successful, it
returns an object with a success flag and the newly created shopping list
item's data; otherwise, it logs an error message and returns an object with
a success flag and an error message.

shopping list item's data or an error message

@param {object} ingredient The ingredient object to add to the shopping list
@return {object} An object with a success flag and either the newly created

### updateShoppingListItem
Updates an existing shopping list item by sending a PATCH request to the
/api/ingredients/shopping endpoint. If the update is successful, it returns
the updated item data. If the request fails, it throws an error with a
relevant message.

the necessary properties like uid, name, quantity, etc.
list item data.

@param {object} item - The shopping list item object to update, containing
@returns {Promise<object>} A promise that resolves to the updated shopping
@throws {Error} If the request fails or the server responds with an error.

### deletePurchasedItems
Deletes all purchased items from the user's shopping list by making a DELETE
request to the /api/ingredients/shopping/items endpoint. If successful, it
returns an object with a success flag; otherwise, it logs an error message
and rethrows the error.

flag or an error message.

@return {Promise<object>} A promise that resolves to an object with a success
@throws {Error} If the request fails or the server responds with an error.

### markPurchasedItems
Marks all unchecked items in the user's shopping list as purchased by making a PATCH
request to the /api/ingredients/shopping/items endpoint. If successful, it returns
an object with a success flag; otherwise, it logs an error message and rethrows the
error.

flag or an error message.

@return {Promise<object>} A promise that resolves to an object with a success
@throws {Error} If the request fails or the server responds with an error.

### deleteShoppingListItem
Deletes a single shopping list item from the user's shopping list by making a DELETE
request to the /api/ingredients/shopping/:uid endpoint. If successful, it returns
an object with a success flag; otherwise, it logs an error message and rethrows the
error.

flag or an error message.

@param {string} uid The unique identifier for the shopping list item to delete.
@return {Promise<object>} A promise that resolves to an object with a success
@throws {Error} If the request fails or the server responds with an error.

### addRecipeLog
Creates a new recipe log entry for the given recipe by making a POST request
to the /api/recipe/:recipeUid/log endpoint. If successful, it returns an
object with a success flag and the newly created recipe log entry's data;
otherwise, it logs an error message and returns an object with a success
flag and an error message.

flag and either the newly created recipe log entry's data
or an error message.

@param {string} recipeUid The unique identifier for the recipe to log.
@return {Promise<object>} A promise that resolves to an object with a success
@throws {Error} If the request fails or the server responds with an error.

### updateEventInBackend
Updates a recipe log entry for the given event by making a PUT request to the
/api/log/:id endpoint. If successful, it does not return anything; otherwise,
it logs an error message and throws an error.


@param {number} id The unique identifier for the recipe log entry to update.
@param {Date|string} start The new start time for the recipe log entry.
@param {Date|string} end The new end time for the recipe log entry.
@param {number} userId The user ID to associate with the recipe log entry.
@throws {Error} If the request fails or the server responds with an error.

### deleteEventInBackend
Deletes a recipe log entry for the given event by making a DELETE request to the
/api/log/:id endpoint. If successful, it does not return anything; otherwise,
it logs an error message and throws an error.


@param {number} id The unique identifier for the recipe log entry to delete.
@throws {Error} If the request fails or the server responds with an error.


## api.js
### createRecipePhotoEntry
Creates a new recipe photo entry in the database.


@param {string} recipeUid - Unique identifier for the recipe.
@param {string} imageUrl - URL of the photo.
@param {string} fileType - The file type of the photo.
@param {boolean} [isMain=false] - Flag indicating if the photo is the main image.
@returns {Promise<Object>} A promise that resolves to the created recipe photo entry.

### removeRecipePhotoEntry
Removes a recipe photo entry from the database.


@param {number|string} uid - Unique identifier for the photo entry to be removed.
@returns {Promise<void>} A promise that resolves when the entry has been deleted.
