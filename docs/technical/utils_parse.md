# Utility Functions – Parse

## downloadRecipes.js
### Function 1
Recipe Downloader and Saver

This script provides utilities for downloading and saving recipes from various websites.
It primarily focuses on extracting JSON-LD formatted recipe data, to save on space
but can also save the entire HTML content if needed.
If the page has already been downloaded, it'll skip the download.
The sites array is the list of sites it'll attempt to download
Currently this just contains the list of failing sites
These have been commented out for ease of debugging
sitePasses are all the sites that have passed tests
sitesCantFix are all the unfixable/unscrapable sites
siteErrors are the sites that failed to download
The recipeParse.test.js also uses the sites array for testing



1. Ensure you have all the required dependencies installed.
2. Uncomment the sites.forEach at the bottom of this file
3. Run the script from the command line: `node src/lib/utils/parse/downloadRecipes.js`
4. The script will attempt to extract recipe data in JSON-LD format.
5. If found, only the recipe data will be saved. Otherwise, the entire HTML content will be saved.
6. The content will be saved in the 'src/lib/data/recipe_html' directory by default.

@module recipeDownloader
@author Your Name
@version 1.0.0
@tutorial

### downloadAndSave
Downloads and saves the content from a given URL. If the content contains a recipe in JSON-LD format,
only the recipe data is saved. Otherwise, the entire HTML content is saved.



await downloadAndSave('https://example.com/recipe');

@async
@function
@param {string} url - The URL to download content from.
@returns {void}
@throws Will throw an error if there's an issue fetching the URL.
@example


## parseErrors.js
### ERRORS
An object containing custom error messages related to recipe parsing.


@type {Object}
@property {Error} NO_JSON_LD - Error indicating no JSON-LD was found in the HTML.
@property {Error} MISSING_DATA - Error indicating missing data in the parsed recipe.
@property {Error} PARSING_ERROR - Error indicating a general parsing error.


## recipeParse.js
### parseRecipe
Parses a given HTML string to extract recipe details.


@param {string} html - The HTML content to parse.
@param {string} url - The URL from which the HTML was fetched.
@returns {Object|string} The extracted recipe details or an error message.

### downloadHTML
Downloads the HTML content of a given URL.


@param {string} url - The URL to fetch.
@returns {Promise<string>} A promise that resolves with the HTML content.

### parseHTML
Parses a given HTML string to extract recipe details.


@param {string} html - The HTML content to parse.
@param {string} url - The URL from which the HTML was fetched.
@returns {Promise<Object|string>} A promise that resolves with the extracted recipe details or an error message.

### parseURL
Downloads and parses the HTML content of a given URL to extract recipe details.


@param {string} url - The URL to fetch and parse.
@returns {Promise<Object|string>} A promise that resolves with the extracted recipe details or an error message.


## parseHelpers.js
### parseRecipeToJSON
Parse the provided JSON-LD string to extract the recipe data.

@param {string} jsonLD - The JSON-LD string containing potential recipe data.
@returns {Object|undefined} The parsed recipe data or undefined if not found.

### getAuthor
Extract the author's name from the provided data.

@param {string|Object} author - The author data, which can be a string or an object.
@returns {string} The author's name.

### durationToText
Convert an ISO duration string to a human-readable format.

@param {string} duration - The ISO duration string.
@returns {string} The human-readable duration.

### parseInstructions
Parse and clean the provided instructions data.

@param {string|Array} instructions - The instructions data.
@returns {Array} An array of cleaned instruction strings.

### parseIngredients
Parse and clean the provided ingredients data.

@param {string|Array} ingredients - The ingredients data.
@returns {Array} An array of cleaned ingredient strings.

### cleanString
Clean a provided string by trimming and removing unnecessary spaces.

@param {string} str - The string to clean.
@returns {string} The cleaned string.

### getUrl
Extract the main URL from the provided recipe data.

@param {Object} recipe - The recipe data.
@returns {string|undefined} The main URL or undefined if not found.

### getImage
Extract the main image URL from the provided image data.

@param {string|Object} image - The image data.
@returns {string|undefined} The image URL or undefined if not found.

### getRating
Convert the provided rating data to a float.

@param {Object} rating - The rating data.
@returns {number|undefined} The rating as a float or undefined if not found.

### parseVideo
Parse the provided video data to extract relevant details.

@param {string|Object} video - The video data.
@returns {Object} An object containing video details.

### getNutrition
Return the provided nutrition data as-is.

@param {Object} nutrition - The nutrition data.
@returns {Object|undefined} The nutrition data or undefined if not provided.

### parseUsingSiteConfig
Extract recipe data using CSS selectors from a parsed HTML root using a provided configuration.

@param {Object} root - The parsed HTML root.
@param {Object} config - The configuration object containing CSS selectors.
@returns {Object} An object containing extracted recipe data.

### getDomainFromUrl
Extract the base domain from a given URL.

@param {string} url - The URL to extract the domain from.
@returns {string} The extracted domain.

### extractMicrodata
Extract schema.org microdata from the provided parsed HTML root.

@param {Object} root - The parsed HTML root.
@returns {Object} An object containing extracted microdata.

### extractNestedProperties
Extract nested properties from a main element using a provided selector.

@param {Object} root - The main element.
@param {string} mainSelector - The CSS selector to use for extraction.
@returns {Object|null} An object containing extracted properties or null if not found.

### extractTextFromSelector
Extract text content from an element using provided selectors.
If the item is meta, extract the content instead

@param {Object} root - The main element.
@param {...string} selectors - The CSS selectors to use for extraction.
@returns {Array} An array containing extracted text content.

### extractIngredientText
Extract ingredient text from an element when standard itemprop attributes are not used.
See the tastykitchen example

@param {Object} item - The main element.
@returns {Array} An array containing extracted ingredient text.

### cleanJsonString
Clean a provided JSON string to make it more readable and standardized.

@param {string} jsonString - The JSON string to clean.
@returns {string} The cleaned JSON string.

### parseJSONLD
Parse and extract recipe data from a provided JSON-LD string within a parsed HTML root.

@param {Object} root - The parsed HTML root.
@returns {Object|null} The parsed recipe data or null if not found.


## parseHelpersClient.js
### scrapeRecipeFromURL
Scrapes recipe data from a given URL.

If successful, the object contains the scraped recipe data under the `data` property.
If unsuccessful, the object contains an error message under the `error` property.

@param {string} url - The URL of the page to scrape.
@returns {Promise<Object>} A promise that resolves to an object with a success flag and either the scraped recipe data or an error message.

### handleScrape
Handles the scraping of a recipe from a given URL.
Optionally prevents the default behavior of a passed event.

along with `_source` and `_status` properties from the raw data.

@param {Event|null} event - The optional event to prevent default on.
@param {string} url - The URL from which to scrape the recipe.
@returns {Promise<Object>} A promise that resolves to an object containing the formatted recipe data,
@throws Will throw an error if the scraping fails.

### handleParse
Parses text for recipe data.
Optionally prevents the default behavior of a passed event.

along with `_source` and `_status` properties from the raw data.

@param {Event|null} event - The optional event to prevent default on.
@param {string} text - The text to parse for recipe data.
@returns {Promise<Object>} A promise that resolves to an object containing the formatted recipe data,
@throws Will throw an error if the parsing fails.

### formatScrapedRecipe
Reusable formatting function for both methods
Formats scraped recipe data into a standardized object.


@param {Object} raw - The scraped recipe data.
@returns {Object} The formatted recipe data.


## parseTesting.js
### mockFetchForURL
Mocks the global fetch function to read from local HTML files instead of making actual HTTP requests.
This is useful for testing purposes to avoid making real network requests.

### urlToFilename
Converts a given URL to a simplified filename string.
This is useful for saving web pages locally with a filename derived from their URL.


@param {string} url - The URL to convert.
@returns {string} The simplified filename string.
