# Utility Functions

## security.js
### validatePassword
Validates a password to ensure it meets the security requirements.


The password must satisfy the following conditions:
- Be at least 8 characters long
- Contain at least one uppercase letter
- Contain at least one lowercase letter
- Contain at least one number
- Contain at least one special character

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| password | `{string}` | The password to validate. |

**Returns**

| Type | Description |
| --- | --- |
| `{isValid: boolean, message: string}` | An object indicating whether the password is valid and a message explaining the validation result. |


## converterBackend.js
### getAllIngredientData
Retrieves all ingredient data from the database.


**Returns**

| Type | Description |
| --- | --- |
| `{Promise<Object[]>}` | A promise that resolves to an array of ingredient objects from the database. |

### convertIngredientsBackend
Converts a list of ingredients from one measurement system to another.

Uses fuzzy matching (via Fuse.js) against ingredient data stored in the database
to assist in identifying appropriate conversion logic. Can optionally skip
conversion of small units (e.g. "pinch", "dash") if specified.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| ingredients | `{Object[]}` | An array of ingredient objects to convert. |
| fromSystem | `{string}` | The measurement system to convert from (e.g., 'metric'). |
| toSystem | `{string}` | The measurement system to convert to (e.g., 'imperial'). |
| skipSmallUnits | `{boolean}` | Whether to skip conversion of small units like 'pinch' or 'dash'. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<Object[]>}` | A promise that resolves to the array of converted ingredient objects. |


## ai.js
### gptExtractRecipeFromContent
Extracts a recipe from the provided content using the OpenAI API.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| content | `{string}` | The input content containing the recipe in HTML or plain text. |
| type | `{string}` | The type of the content, either 'html' or 'text'. |
| url | `{string}` | The URL where the content originated, used only for HTML content. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<Object>}` | A promise that resolves to an object representing the extracted recipe. |

**Throws**

| Type | Description |
| --- | --- |
| `{Error}` | Throws an error if the OpenAI API is disabled, the API key is missing, or if the content parsing fails. |


## categories.js
### buildHierarchy
Builds a hierarchical structure from a flat list of categories.
This is used for taking a user's categories and building a structure from them
They're stored in a flat structure in the DB


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| categories | `{Array}` | An array of category objects with uid, parent_uid, and other properties. |

**Returns**

| Type | Description |
| --- | --- |
| `{Array}` | An array of root categories, each with a nested structure of children. |

### transformToNodes
Transforms a hierarchical category structure into a format suitable for svelte-dnd-action.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| categories | `{Array}` | An array of hierarchical category objects. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object}` | An object of nodes, each representing a category. |

### wrapTopLevelNodes
Wraps all top-level nodes in an outer node.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| data | `{Object}` | An object of nodes, each representing a category. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object}` | The input data with all top-level nodes wrapped in an outer node. |

### fetchAndTransformCategories
Fetches categories for a user and transforms them into a suitable format.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| fetch | `{Function}` | The fetch function to use. |
| url | `{URL}` | The base URL to fetch from. |
| userId | `{string}` | The ID of the user whose categories to fetch. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<Object>}` | An object of nodes, each representing a category. |

### sortItemsAlphabetically
Sorts the items in each node alphabetically by name.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| nodes | `{Object}` | An object of nodes, each representing a category. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object}` | The input nodes with items sorted alphabetically. |

### collectSelectedUids
Collects the UIDs of all selected categories from a hierarchical structure.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| categories | `{Array}` | An array of hierarchical category objects. |

**Returns**

| Type | Description |
| --- | --- |
| `{Array<string>}` | An array of UIDs of selected categories. |


## sorting.js
### sortRecipesByKey
Sorts an array of recipes by a given key.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| recipes | `{Object[]}` | Array of recipes to sort. |
| key | `{string}` | The key by which to sort the recipes. |
| currentSort | `{string}` | The current sort direction ('asc' or 'desc'). |

**Returns**

| Type | Description |
| --- | --- |
| `{sortedRecipes: Object[], newSort: string}` | An object containing the sorted recipes and the new sort direction. |

### sortByKeyGeneric
Sorts an array by a given key in either ascending or descending order.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| inputArray | `{Object[]}` | Array of objects to sort. |
| inputKey | `{string}` | The key by which to sort the array. |
| direction | `{string}` | The sort direction ('asc' or 'desc'). |

**Returns**

| Type | Description |
| --- | --- |
| `{Object[]}` | The sorted array. |

### sortByTwoKeys
Sorts an array of objects by two keys, with specified sort directions for each key.
The array is first sorted by the `primarySortKey` in the specified `primaryDirection`.
If two elements have the same value for the `primarySortKey`, they are then sorted
by the `secondarySortKey` in the specified `secondaryDirection`.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| inputArray | `{Object[]}` | The array of objects to sort. |
| primarySortKey | `{string}` | The key to sort the array by initially. |
| secondarySortKey | `{string}` | The key to sort the array by when the primary key values are equal. |
| primaryDirection | `{string}` | The sort direction for the primary key ('asc' or 'desc'). |
| secondaryDirection | `{string}` | The sort direction for the secondary key ('asc' or 'desc'). |

**Returns**

| Type | Description |
| --- | --- |
| `{Object[]}` | The array sorted by the specified primary and secondary keys. |

### sortByDate
Sorts an array by a date key in either ascending or descending order.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| inputArray | `{Object[]}` | Array of objects to sort. |
| dateKey | `{string}` | The date key by which to sort the array. |
| direction | `{string}` | The sort direction ('asc' or 'desc'). |

**Returns**

| Type | Description |
| --- | --- |
| `{Object[]}` | The sorted array. |

### randomSortArray
Sorts the input array randomly.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| inputArray | `{stringDateRecord[]}` | Array of records to sort. |

**Returns**

| Type | Description |
| --- | --- |
| `{stringDateRecord[]}` | Randomly sorted array. |

### sortByNameRecursive
Recursively sorts an array of objects by their 'name' property.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| data | `{Object[]}` | Array of objects to sort. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object[]}` | The sorted array. |


## dryIngredientsConversion.js
### dryIngredientsConversion
List of weights for 1 cup of different dried ingredients
The names uses an array so can be for multiple names of an ingredient

**Type**

```JS
{ Object }
```


## converter.js
### converter
Converts a quantity from one unit to another.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| quantity | `{number}` | The quantity of the 'from' unit. |
| from | `{string}` | The original unit to be converted. |
| to | `{string}` | The unit to be converted to. |

**Returns**

| Type | Description |
| --- | --- |
| `{quantity: number, unit: string} \| {error: string}` | Returns an object containing either the converted quantity and unit or an error message. |

### determineSystem
Determines the dominant measurement system used in an array of ingredients.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| ingredientArray | `{Array}` | An array of ingredient objects. |

**Returns**

| Type | Description |
| --- | --- |
| `{system: string, counts: Object}` | The dominant system and the counts of each system. |

### systemToUnitsMap
Mapping of measurement systems to their respective units.

**Type**

```JS
{ Object }
```

### measurementSystems
Manipulates an ingredient object to convert its quantity and unit from one system to another.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| ingredientObj | `{Object}` | The ingredient object to be manipulated. |
| fromSystem | `{string}` | The original measurement system. |
| toSystem | `{string}` | The target measurement system. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object}` | The manipulated ingredient object with converted quantity and unit. |

### fuzzyMatch
Attempts to find a match for an ingredient in a lookup table.
This was used in the manipulate ingredients function before I transitioned to the database version


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| ingredient | `{string}` | The ingredient name to match. |
| lookupTable | `{Array}` | The table of ingredients to search within. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object\|null}` | Returns the matched ingredient object or null if no match is found. |

### addFoodPreferences
Searches through the food preferences database to find a match for the given ingredient name.
Returns an object with the following properties: vegan, vegetarian, pescatarian, canBeVegan.
If no match is found, returns an object with all properties set to true.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| ingredientName | `{string}` | The ingredient name to search for. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object}` | An object with the search results. |

### getDietLabel
Generates a string label indicating the dietary preference
of the given ingredient based on the given preferences.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| prefs | `{Object}` | The preferences object for the ingredient. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | A string label indicating the dietary preference. |

### normalizeIngredient
Normalizes an ingredient object by standardizing units, rounding quantity, and adding metadata.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| ingredientObj | `{Object}` | The original ingredient object. |
| options | `{Object}` | Optional settings. |
| options | `{boolean}` |  |

**Returns**

| Type | Description |
| --- | --- |
| `{Object}` | Normalized ingredient object. |

### manipulateIngredient
Manipulates an ingredient object to convert its quantity and unit from one system to another.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| ingredientObj | `{Object}` | The ingredient object to be manipulated. |
| fromSystem | `{string}` | The original measurement system. |
| toSystem | `{string}` | The target measurement system. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object}` | The manipulated ingredient object with converted quantity and unit. |

### parseRecipeText
Converts temperatures in an array of direction strings from one system to another.

This function iterates over each direction in the array and converts any temperatures
found within each direction from the original system to the target system using the
`parseTemperature` function.

Accepted values: 'metric', 'imperial', 'americanVolumetric'.
Accepted values: 'metric', 'imperial'.



**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| directions | `{string[]}` | An array of direction strings containing temperature values to be converted. |
| toSystem | `{string}` | The target temperature system for conversion. |
| fromSystem | `{string}` | The original temperature system of the values in the direction strings. |

**Returns**

| Type | Description |
| --- | --- |
| `{string[]}` | An array of direction strings with temperatures converted to the target system. |

**Example**

```JS

parseRecipeText(["Preheat oven to 350°F", "Bake at 180C"], "metric", "imperial");
// Returns: ["Preheat oven to 176°C", "Bake at 356°F"]

```

### parseTemperature
Converts temperatures in a given string from one system to another.

The function identifies temperatures in Celsius, Fahrenheit, and generic "degrees" format.
It supports both single values and ranges (e.g., "70C", "70 to 80 degrees F").
Conversion is based on the specified source and target system.

Note: 'americanVolumetric' is treated as a subtype of 'imperial'.



**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| direction | `{string}` | The input string containing temperature values. |
| toSystem | `{string}` | The target system: 'metric', 'imperial', or 'americanVolumetric'. |
| fromSystem | `{string}` | The source system: 'metric' or 'imperial'. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | The string with converted temperatures, wrapped in `**`, or original if no conversion needed. |

**Example**

```JS

parseTemperature("Preheat oven to 350°F", "metric", "imperial");
// => "Preheat oven to **176°C**"

parseTemperature("Set water to 70 to 80 degrees C", "imperial", "metric");
// => "Set water to **158-176°F**"
```


## wakeLock.js
### requestWakeLock
Requests a Wake Lock from the browser, which keeps the screen awake while the document is visible.
If the Wake Lock API is not supported, logs a warning to the console.


**Returns**

| Type | Description |
| --- | --- |
| `{Promise<void>}` |  |

### releaseWakeLock
Releases the Wake Lock if it is currently held, allowing the screen to turn off.
Logs a message to the console when the Wake Lock is released.
If the Wake Lock is not held or the environment is not a browser, the function returns immediately.


**Returns**

| Type | Description |
| --- | --- |
| `{Promise<void>}` |  |

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


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| content | `{string}` | Markdown content to be sanitized and rendered as HTML. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<string>}` | Sanitized HTML content. |


## units.js
### units
Represents an array of unit objects.

**Type**

```JS
{ Object[] }
```

**Properties**

| Property | Type | Description |
| --- | --- | --- |
| names | `{ string[] }` | Different names for a given unit. |
| grams | `{ number }` | The gram equivalent of the unit. |
| skipConversion | `{ boolean }` | Whether to skip conversion, often used for volumetric units like teaspoons. |
| decimalPlaces | `{ number }` | Number of decimal places for display. |

### shouldSkipConversion
Determines if a unit should skip conversion based on its name.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| unit | `{string}` | The name of the unit. |

**Returns**

| Type | Description |
| --- | --- |
| `{boolean}` | Returns true if the unit should skip conversion, otherwise false. |

### findSuitableUnit
Finds a suitable unit for a given system and quantity in grams.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| system | `{string}` | The system to use ('imperial', 'metric', or 'americanVolumetric'). |
| quantityInGrams | `{number}` | The quantity in grams. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | The name of the suitable unit. |


## config.js
### systems
Supported measurement systems for recipe data.
Each system includes a machine-readable value and a user-friendly label.


**Type**

```JS
{ { value: string, label: string }
```

### languages
Supported languages for the application.
Each language includes a language code and its display label.


**Type**

```JS
{ { value: string, label: string }
```

### defaultRecipe
Default structure for a recipe object.
Used to initialize empty recipe forms or reset state.



**Type**

```JS
{ name: string,
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
 }
```


## dateTime.js
### localDateAndTime
Accepts date objects or strings and returns a string in local date and time format.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| dateTime | `{(string\|Date\|null)}` | A date object, date string, or null. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | The local date and time in string format. |

### localDate
Takes a dateTime parameter and returns the local date.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| dateTime | `{any}` | the date and time input |

@return {string} the local date

### getIsoDateTimeString
Returns the current datetime in ISO 8601 format.

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | The current datetime in ISO 8601 format. |

### stringToISOString
Parse a date string and convert it to ISO format.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| dateString | `{string}` | The date string to be parsed. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | The ISO format of the parsed date string. |

### convertToMinutes
Convert a text input into minutes.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| input | `{string}` | The input string containing duration in text format. |

**Returns**

| Type | Description |
| --- | --- |
| `{(number\|null)}` | The total number of minutes represented by the input string, or null if parsing failed. |

### convertMinutesToTime
Convert a number of minutes into a readable string.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| minutes | `{number}` | The total number of minutes. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | The duration in a readable string format. |


## filters.js
### filterSearch
Filters data based on a search string and a key.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| searchString | `{string \| null}` | The search string. |
| data | `{IGenericRecord[]}` | An array of data to search through. |
| key | `{string}` | The key in the data objects to search against. |

**Returns**

| Type | Description |
| --- | --- |
| `{IGenericRecord[]}` | The filtered array. |

### ingredientProcess
Processes an array of ingredient strings to return parsed ingredient objects.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| ingredientArray | `{string[]}` | The ingredient strings to process. |

**Returns**

| Type | Description |
| --- | --- |
| `{parsedIngredient[]}` | An array of parsed ingredient objects. |

### sanitizeIngredient
Sanitize a string for YAML front matter.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| str | `{string}` | The input string to sanitize. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | The sanitized string. |

### scaleNumbersInString
Scales numbers within a string by a specified factor. This includes whole numbers, fractions, Unicode fractions,
decimal numbers, and combinations of whole numbers and fractions (with or without space).


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| str | `{string}` | The string with numbers to scale. |
| scale | `{number}` | The factor to scale numbers by. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | The string with scaled numbers. |

### convertToDecimal
Converts a fraction string or a whole number plus fraction string to a decimal.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| str | `{string}` | The string to convert, which can be a simple fraction or a whole number plus fraction. |

**Returns**

| Type | Description |
| --- | --- |
| `{number}` | The decimal equivalent of the input. |

### decimalToFraction
Converts a decimal number to its fraction representation, if possible.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| decimal | `{number}` | The decimal number to convert. |

**Returns**

| Type | Description |
| --- | --- |
| `{string \| number}` | The fraction representation or original number. |

### roundIngredientQuantity
Rounds an ingredient quantity to the nearest whole number if greater than 10,
or to one decimal place if 10 or less.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| decimal | `{number}` | The decimal quantity to round. |

**Returns**

| Type | Description |
| --- | --- |
| `{number}` | The rounded quantity. |

### roundToDecimalPlaces
Rounds a number to a specified number of decimal places.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| num | `{number}` | The number to be rounded. |
| decimalPlaces | `{number}` | The number of decimal places to round to. |

**Returns**

| Type | Description |
| --- | --- |
| `{number}` | The rounded number. |

@function

**Example**

```JS


roundToDecimalPlaces(123.4567, 2); // returns 123.46
```

### roundToTolerance
Rounds a number to the nearest integer if it's within a specified tolerance.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| num | `{number}` | The number to be checked and potentially rounded. |
| tolerance | `{number}` | The tolerance within which the number will be rounded to the nearest integer. |

**Returns**

| Type | Description |
| --- | --- |
| `{number}` | The original number or its rounded value if it's within the tolerance. |

@function

**Example**

```JS


roundToTolerance(123.00000000001); // returns 123
roundToTolerance(123.0001, 0.001); // returns 123
```

### unicodeToAscii
Converts unicode characters in a string to their ASCII representation.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| str | `{string}` | The string to convert. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | The string with unicode characters converted to ASCII. |

### decodeHTMLEntities
Decodes HTML entities in a string.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| str | `{string}` | The string with HTML entities. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | The decoded string. |

### startsWithHttp
Checks if a string starts with "http".


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| str | `{string}` | The string to check. |

**Returns**

| Type | Description |
| --- | --- |
| `{boolean}` | True if the string starts with "http", otherwise false. |

### nutritionProcess
Processes a nutrition object and converts it to a readable string.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| nutritionObject | `{object}` | The nutrition object to process. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | A string representation of the nutrition object. |


## crud.js
### deleteRecipeById
Deletes a recipe by its unique identifier.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| uid | `{number\|string}` | Unique identifier for the recipe to be deleted. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<boolean>}` | A promise that resolves to true if the recipe was deleted successfully, or false if not. |

### addRecipeToFavourites
Adds a recipe to the user's favourites.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| uid | `{number\|string}` | Unique identifier for the recipe to be added. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<boolean>}` | A promise that resolves to true if the recipe was added to favourites successfully, or false if not. |

### recipeRatingChange
Updates the rating of a recipe on the server.



**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| newRating | `{number}` | The new rating to be set, between 1 and 5. |
| uid | `{number\|string}` | Unique identifier for the recipe to be updated. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<void>}` | A promise that resolves if the update was successful. If not, the promise is rejected. |

### updateRecipe
Updates an existing recipe on the server.

If successful, the object contains the updated recipe data under the `data` property.
If unsuccessful, the object contains an error message under the `error` property.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| formData | `{FormData}` | The form data containing the updated recipe information. |
| recipeId | `{number\|string}` | Unique identifier for the recipe to be updated. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<Object>}` | A promise that resolves to an object indicating success or failure. |

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

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| recipe | `{Object}` | The new recipe information, with the following properties: |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<Object>}` | A promise that resolves to an object indicating success or failure. |

### deletePhotoById
Deletes a single photo by its unique identifier.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| id | `{number\|string}` | The unique identifier of the photo to be deleted. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<boolean>}` | A promise that resolves to true if the photo was deleted successfully, or false if not. |

### updatePhotos
Updates one or more photos for a recipe on the server.

- id: number|string - The unique identifier for the photo to be updated.
- notes: string - The new notes for the photo.
- isMain: boolean - Whether the photo should be set as the main photo.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| photos | `{Array<Object>}` | An array of objects with the following properties: |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<boolean>}` | A promise that resolves to true if the photos were updated successfully, or false if not. |

### importFileExists
Checks if a file exists in the /uploads/import directory.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| filename | `{string}` | The name of the file to look for. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<boolean>}` | A promise that resolves to true if the file exists, or false if not. |

### uploadPaprikaFile
Uploads a .paprikarecipes zip file to the server.

- `success`: A boolean indicating whether the upload was successful.
- `message`: A string containing an error message if the upload failed, or a success message if the upload succeeded.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| formData | `{FormData}` | A FormData object containing the file to be uploaded. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<Object>}` | A promise that resolves to an object with the following properties: |

### dbCatCount
Fetches the count of categories from the database for a given user.

If an error occurs during the fetch operation, it returns 0.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| userId | `{string\|number}` | The unique identifier of the user whose categories are being counted. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<number>}` | A promise that resolves to the number of categories in the user's database. |

### dbRecCount
Fetches the count of recipes from the database for a given user.

If an error occurs during the fetch operation, it returns 0.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| userId | `{string\|number}` | The unique identifier of the user whose recipes are being counted. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<number>}` | A promise that resolves to the number of recipes in the user's database. |

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

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| ingredient | `{object}` |  |

@return {object} An object with a success flag and either the newly created

### updateShoppingListItem
Updates an existing shopping list item by sending a PATCH request to the
/api/ingredients/shopping endpoint. If the update is successful, it returns
the updated item data. If the request fails, it throws an error with a
relevant message.

the necessary properties like uid, name, quantity, etc.
list item data.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| item | `{object}` | The shopping list item object to update, containing |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<object>}` | A promise that resolves to the updated shopping |

**Throws**

| Type | Description |
| --- | --- |
| `{Error}` | If the request fails or the server responds with an error. |

### deletePurchasedItems
Deletes all purchased items from the user's shopping list by making a DELETE
request to the /api/ingredients/shopping/items endpoint. If successful, it
returns an object with a success flag; otherwise, it logs an error message
and rethrows the error.

flag or an error message.

**Throws**

| Type | Description |
| --- | --- |
| `{Error}` | If the request fails or the server responds with an error. |

@return {Promise<object>} A promise that resolves to an object with a success

### markPurchasedItems
Marks all unchecked items in the user's shopping list as purchased by making a PATCH
request to the /api/ingredients/shopping/items endpoint. If successful, it returns
an object with a success flag; otherwise, it logs an error message and rethrows the
error.

flag or an error message.

**Throws**

| Type | Description |
| --- | --- |
| `{Error}` | If the request fails or the server responds with an error. |

@return {Promise<object>} A promise that resolves to an object with a success

### deleteShoppingListItem
Deletes a single shopping list item from the user's shopping list by making a DELETE
request to the /api/ingredients/shopping/:uid endpoint. If successful, it returns
an object with a success flag; otherwise, it logs an error message and rethrows the
error.

flag or an error message.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| uid | `{string}` |  |

**Throws**

| Type | Description |
| --- | --- |
| `{Error}` | If the request fails or the server responds with an error. |

@return {Promise<object>} A promise that resolves to an object with a success

### addRecipeLog
Creates a new recipe log entry for the given recipe by making a POST request
to the /api/recipe/:recipeUid/log endpoint. If successful, it returns an
object with a success flag and the newly created recipe log entry's data;
otherwise, it logs an error message and returns an object with a success
flag and an error message.

flag and either the newly created recipe log entry's data
or an error message.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| recipeUid | `{string}` |  |

**Throws**

| Type | Description |
| --- | --- |
| `{Error}` | If the request fails or the server responds with an error. |

@return {Promise<object>} A promise that resolves to an object with a success

### updateEventInBackend
Updates a recipe log entry for the given event by making a PUT request to the
/api/log/:id endpoint. If successful, it does not return anything; otherwise,
it logs an error message and throws an error.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| id | `{number}` |  |
| start | `{Date\|string}` |  |
| end | `{Date\|string}` |  |
| userId | `{number}` |  |

**Throws**

| Type | Description |
| --- | --- |
| `{Error}` | If the request fails or the server responds with an error. |

### deleteEventInBackend
Deletes a recipe log entry for the given event by making a DELETE request to the
/api/log/:id endpoint. If successful, it does not return anything; otherwise,
it logs an error message and throws an error.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| id | `{number}` |  |

**Throws**

| Type | Description |
| --- | --- |
| `{Error}` | If the request fails or the server responds with an error. |


## api.js
### createRecipePhotoEntry
Creates a new recipe photo entry in the database.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| recipeUid | `{string}` | Unique identifier for the recipe. |
| imageUrl | `{string}` | URL of the photo. |
| fileType | `{string}` | The file type of the photo. |
| isMain | `{boolean}` | Flag indicating if the photo is the main image. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<Object>}` | A promise that resolves to the created recipe photo entry. |

### removeRecipePhotoEntry
Removes a recipe photo entry from the database.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| uid | `{number\|string}` | Unique identifier for the photo entry to be removed. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<void>}` | A promise that resolves when the entry has been deleted. |
