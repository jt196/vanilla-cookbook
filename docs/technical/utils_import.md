# Utility Functions – Import

## recipeImport.js
### extractRecipes
Extracts recipes from a given zip file.
Doesn't use local storage, runs everything in memory.

@param {string} zipFilePath - The path to the zip file containing the recipes.
@returns {Promise<Array>} - An array of extracted recipes.

### filterRecipeData
Filters the recipe JSON data to only include fields that exist in the database.

@param {Object} recipe - The recipe data to be filtered.
@returns {Object} - The filtered recipe data.


## files.js
### isValidFileType
Validates the file type of a given stream against desired extensions.
Check for multiple types: isValidFileType(file, ['zip', 'gzip'])
Check for a single type: isValidFileType(file, 'zip')

any of the desired extensions, false otherwise.

@param {ReadableStream} stream - The stream of the file to be checked.
@param {string|string[]} desiredExtensions - The extension(s) to validate against.
@returns {Promise<boolean>} A promise that resolves to true if the file type matches

### saveFile
Saves a given file data to a specified filename in a given directory.
If the file already exists, this function will not overwrite it.

@param {ArrayBuffer|string} fileData - The data of the file to be saved.
@param {string} filename - The name of the file to be saved.
@param {string} directory - The directory in which to save the file.
@throws {Error} If there is an error while saving the file.

### isValidRecipeStructure
Checks if the given recipes data structure is valid.
This function checks if the given data is an array of objects,
and if the first object in the array has the required fields.
The required fields are:
- name: a string

@param {Array} recipes - The recipes data structure to be validated.
@return {boolean} true if the structure is valid, false otherwise.


## paprikaAPIUtils.js
### Function 1
Utility functions for fetching and processing data from the Paprika API.

@module paprikaAPI

### resource
Fetches data from the Paprika API for a given endpoint.

@param {string} endpoint - The Paprika API endpoint.
@param {string} email - The user's email.
@param {string} password - The user's password.
@returns {Promise<Object>} - The data fetched from the API.

### bookmarks
Fetches bookmarks from the Paprika API.

@param {string} email - The user's email.
@param {string} password - The user's password.
@returns {Promise<Object>} - The bookmarks data fetched from the API.

### download
Downloads a file from a given URI and saves it to a specified filename.

@param {string} uri - The URI of the file to be downloaded.
@param {string} filename - The name of the file where the data will be saved.
@returns {Promise<void>}

### downloadImageAsBuffer
Downloads an image from a given URL and returns it as a buffer.


@param {string} url - The URL of the image to download.
@returns {Promise<Buffer>} A promise that resolves with the downloaded image as a buffer.

### exportRecipes
Exports recipes from the Paprika API.

@param {string} username - The user's username.
@param {string} password - The user's password.
@returns {Promise<Array>} - An array of detailed recipes.

### saveRecipes
Saves recipes to a specified file and downloads their photos.

@param {string} username - The user's username.
@param {string} password - The user's password.
@param {string} filename - The name of the file where recipes will be saved.
@param {string} photoDirectory - The directory where recipe photos will be saved.
@returns {Promise<void>}

### fetchFirstRecipeDetails
Fetches details of the first recipe from the Paprika API.

@param {string} email - The user's email.
@param {string} password - The user's password.
@returns {Promise<Array>} - An array containing details of the first recipe.

### fetchDetailedRecipes
Fetches detailed recipes from the Paprika API.
Be careful when using as I don't know whether rate limits exist
Grab the list of uids from the API, then grab each recipe's details


@param {string} email - The user's email.
@param {string} password - The user's password.
@returns {Promise<Array>} - An array of detailed recipes.

### replaceCategoryUIDsWithNames
Replaces category UIDs in a recipe with their respective names.

@param {Object} recipe - The recipe object containing category UIDs.
@param {string} email - The user's email.
@param {string} password - The user's password.
@returns {Promise<Object>} - The updated recipe with category names.

### getCategories
Downloads categories from the Paprika API and saves them to lib/data/categories.json

@param {string} email - The user's email.
@param {string} password - The user's password.
@returns {Promise<Array>} - An array of categories.

### loadCategories
1. Loads categories from a specified file path.
Tries to access and read the file, parsing its contents as JSON.
If the file does not exist or an error occurs during reading,
logs the error and returns an empty array.

or an empty array if the file cannot be accessed or read.

@param {string} filepath - The path to the categories file.
@returns {Promise<Array>} - A promise that resolves to an array of categories,

### loadRecipes
Loads recipes from a given filename, which can be either a .json file or a .paprikarecipes archive.
If the file is a .json file, it is parsed as JSON. If it is a .paprikarecipes archive,
it is extracted using the extractRecipes function.
The recipes structure is then validated using the isValidRecipeStructure function.
If the recipes structure is invalid, an error is thrown.
If there is an error loading the recipes, an error is logged to the console and an empty array is returned.

@param {string} filename - The name of the file to load recipes from.
@returns {Promise<Array>} - The loaded recipes, or an empty array if there was an error.

### addCategoriesToDB
2. Adds categories to the database.

@param {Array} categories - An array of categories to be added.
@param {string} userId - The user's ID.
@returns {Promise<void>}

### addRecipesToDB
Adds recipes to the database.
stripped of any fields that don't exist on the recipe table in the DB).

@param {Array} declaredRecipes - An array of declared recipes (i.e. recipes
@param {string} userId - The user's ID.
@returns {Promise<Array>} - An array of created recipes.

### handlePhotosForRecipes
Handles all of the photo-related processing for recipes that have been added to the database.
This includes:
- Saving the main photo to the uploads directory
- Creating a RecipePhoto record for the main photo
- Handling the photos array by saving each photo to the uploads directory and creating a RecipePhoto record
- If the recipe is in .json format, downloading the photo from the photo_url field
- If all of the above haven't managed to grab an image, downloading it from the image_url field

@param {Array} createdRecipes - An array of created recipes.
@returns {Promise<void>}

### addRecipeCategoriesToDB
Adds categories to recipes in the database.

@param {Array} createdRecipes - An array of created recipes.
@param {Array} rawRecipes - An array of raw recipes.

### ensureCategoriesExist
Parse a recipe object and create any categories that don't exist
Ensures that all categories from the raw recipes exist in the database.
and newly created.

@param {Array} rawRecipes - An array of raw recipes.
@param {string} adminUserId - The ID of the admin user to create the categories under.
@returns {Promise<Array>} A promise that resolves to an array of all categories, both existing

### Function 19
Extracts the file extension from a given filename.


@param {string} filename - The name of the file to extract the extension from.
@returns {string} - The file extension.

### getFileType
Extracts the file extension from a given filename.


@param {string} filename - The name of the file to extract the extension from.
@returns {string} - The file extension.

### declareRecipes
Takes an array of raw recipes and returns a new array with the recipe fields
remapped to match the columns in the Recipe table.

@param {Array} rawRecipes - The array of raw recipes.
@param {boolean} isPublic - Whether the recipes should be marked as public.
@returns {Promise<Array>} A promise that resolves to an array of remapped recipe objects.

### getJSONLength
Reads a JSON file and returns the length of the array stored in the file. If the file
does not exist, or if the file is not a valid JSON file, or if the JSON content is not
an array, returns null. If the file is empty, returns 0.

stored in the file, or null if the file does not exist or is malformed.

@param {string} filePath - The path to the JSON file.
@returns {Promise<number | null>} A promise that resolves to the length of the array

### filterExistingRecipes
Filters out recipes that already exist in the database from a given array of raw recipes.

This function takes an array of raw recipe objects and checks their unique identifiers (UIDs)
against those stored in the database. It returns a new array containing only the recipes
that are not already present in the database.


@param {Array} rawRecipes - An array of raw recipe objects, each containing a unique identifier (UID).
@returns {Promise<Array>} A promise that resolves to an array of recipes that do not exist in the database.


## paprikaAPI.js
### Function 1
Utility script to fetch data from the Paprika API and save it to local JSON files.

This script uses the Paprika API to fetch various types of data (e.g., recipes, categories, groceries)
and saves the fetched data as JSON files in the `uploads/imports` directory.

Before running the script, ensure that the Paprika email and password are set in the `.env` file.


@module paprikaAPI
@requires fs/promises
@requires path
@requires dotenv
@requires ./paprikaAPI.js

### fetchData
Fetches data from the Paprika API and saves it to a JSON file.


@param {string} fetchType - The type of data to fetch (e.g., 'categories', 'recipes', 'groceries', etc.).
@param {string} email - The user's email.
@param {string} password - The user's password.
@param {string} userId - The ID of the user whose data to fetch.
@returns {Promise<string>} - A promise that resolves with a success message if the fetch is successful, or rejects with an error message if the fetch fails.


## paprikaFileImport.js
### importPaprikaData
Load categories and recipes from the Paprika API, or local JSON at uploads/imports/categories.json and uploads/imports/recipes.json and save them to the database.

@param {number} userId - The ID of the user whose data we are importing.

### importPaprikaCategories
Load categories from the Paprika API, or local JSON at uploads/imports/categories.json and save them to the database.

@param {number} userId - The ID of the user whose categories we are importing.

### importPaprikaRecipes
Imports recipes from a specified file into the database for a given user.

This function loads recipes from a file, checks for duplicates against existing recipes,
and imports new recipes into the database. It ensures that categories exist in the database
and associates them with the recipes. Additionally, it handles the import of recipe photos.


@param {number} userId - The ID of the user whose recipes are being imported.
@param {string} filename - The name of the file from which recipes will be loaded.
@param {boolean} [isPublic=false] - A flag indicating whether the imported recipes should be public.
@returns {Promise<Object>} An object containing the success status, a message, and the count of imported recipes.
