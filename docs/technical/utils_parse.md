# Utility Functions – Parse

## downloadRecipes.js
### sitePasses
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




**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| url | `{string}` | The URL to download content from. |

**Returns**

| Type | Description |
| --- | --- |
| `{void}` |  |

**Throws**

| Type | Description |
| --- | --- |
| @throws Will throw an error if there's an issue fetching the URL. |  |

@async
@function

**Example**

```JS

await downloadAndSave('https://example.com/recipe');
```


## parseErrors.js
### ERRORS
An object containing custom error messages related to recipe parsing.


**Type**

```JS
{ Object }
```

**Properties**

| Property | Type | Description |
| --- | --- | --- |
| NO_JSON_LD | `{ Error }` | Error indicating no JSON-LD was found in the HTML. |
| MISSING_DATA | `{ Error }` | Error indicating missing data in the parsed recipe. |
| PARSING_ERROR | `{ Error }` | Error indicating a general parsing error. |


## recipeParse.js
### parseRecipe
Parses a given HTML string to extract recipe details.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| html | `{string}` | The HTML content to parse. |
| url | `{string}` | The URL from which the HTML was fetched. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object\|string}` | The extracted recipe details or an error message. |

### downloadHTML
Downloads the HTML content of a given URL.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| url | `{string}` | The URL to fetch. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<string>}` | A promise that resolves with the HTML content. |

### parseHTML
Parses a given HTML string to extract recipe details.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| html | `{string}` | The HTML content to parse. |
| url | `{string}` | The URL from which the HTML was fetched. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<Object\|string>}` | A promise that resolves with the extracted recipe details or an error message. |

### parseURL
Downloads and parses the HTML content of a given URL to extract recipe details.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| url | `{string}` | The URL to fetch and parse. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<Object\|string>}` | A promise that resolves with the extracted recipe details or an error message. |


## parseHelpers.js
### parseRecipeToJSON
Parse the provided JSON-LD string to extract the recipe data.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| jsonLD | `{string}` | The JSON-LD string containing potential recipe data. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object\|undefined}` | The parsed recipe data or undefined if not found. |

### getAuthor
Extract the author's name from the provided data.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| author | `{string\|Object}` | The author data, which can be a string or an object. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | The author's name. |

### durationToText
Convert an ISO duration string to a human-readable format.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| duration | `{string}` | The ISO duration string. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | The human-readable duration. |

### parseInstructions
Parse and clean the provided instructions data.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| instructions | `{string\|Array}` | The instructions data. |

**Returns**

| Type | Description |
| --- | --- |
| `{Array}` | An array of cleaned instruction strings. |

### parseIngredients
Parse and clean the provided ingredients data.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| ingredients | `{string\|Array}` | The ingredients data. |

**Returns**

| Type | Description |
| --- | --- |
| `{Array}` | An array of cleaned ingredient strings. |

### cleanString
Clean a provided string by trimming and removing unnecessary spaces.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| str | `{string}` | The string to clean. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | The cleaned string. |

### getUrl
Extract the main URL from the provided recipe data.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| recipe | `{Object}` | The recipe data. |

**Returns**

| Type | Description |
| --- | --- |
| `{string\|undefined}` | The main URL or undefined if not found. |

### getImage
Extract the main image URL from the provided image data.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| image | `{string\|Object}` | The image data. |

**Returns**

| Type | Description |
| --- | --- |
| `{string\|undefined}` | The image URL or undefined if not found. |

### getRating
Convert the provided rating data to a float.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| rating | `{Object}` | The rating data. |

**Returns**

| Type | Description |
| --- | --- |
| `{number\|undefined}` | The rating as a float or undefined if not found. |

### parseVideo
Parse the provided video data to extract relevant details.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| video | `{string\|Object}` | The video data. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object}` | An object containing video details. |

### getNutrition
Return the provided nutrition data as-is.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| nutrition | `{Object}` | The nutrition data. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object\|undefined}` | The nutrition data or undefined if not provided. |

### parseUsingSiteConfig
Extract recipe data using CSS selectors from a parsed HTML root using a provided configuration.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| root | `{Object}` | The parsed HTML root. |
| config | `{Object}` | The configuration object containing CSS selectors. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object}` | An object containing extracted recipe data. |

### getDomainFromUrl
Extract the base domain from a given URL.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| url | `{string}` | The URL to extract the domain from. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | The extracted domain. |

### extractMicrodata
Extract schema.org microdata from the provided parsed HTML root.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| root | `{Object}` | The parsed HTML root. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object}` | An object containing extracted microdata. |

### extractNestedProperties
Extract nested properties from a main element using a provided selector.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| root | `{Object}` | The main element. |
| mainSelector | `{string}` | The CSS selector to use for extraction. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object\|null}` | An object containing extracted properties or null if not found. |

### extractTextFromSelector
Extract text content from an element using provided selectors.
If the item is meta, extract the content instead

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| root | `{Object}` | The main element. |
| selectors | `{...string}` | The CSS selectors to use for extraction. |

**Returns**

| Type | Description |
| --- | --- |
| `{Array}` | An array containing extracted text content. |

### extractIngredientText
Extract ingredient text from an element when standard itemprop attributes are not used.
See the tastykitchen example

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| item | `{Object}` | The main element. |

**Returns**

| Type | Description |
| --- | --- |
| `{Array}` | An array containing extracted ingredient text. |

### cleanJsonString
Clean a provided JSON string to make it more readable and standardized.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| jsonString | `{string}` | The JSON string to clean. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | The cleaned JSON string. |

### parseJSONLD
Parse and extract recipe data from a provided JSON-LD string within a parsed HTML root.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| root | `{Object}` | The parsed HTML root. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object\|null}` | The parsed recipe data or null if not found. |


## parseHelpersClient.js
### scrapeRecipeFromURL
Scrapes recipe data from a given URL.

If successful, the object contains the scraped recipe data under the `data` property.
If unsuccessful, the object contains an error message under the `error` property.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| url | `{string}` | The URL of the page to scrape. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<Object>}` | A promise that resolves to an object with a success flag and either the scraped recipe data or an error message. |

### handleScrape
Handles the scraping of a recipe from a given URL.
Optionally prevents the default behavior of a passed event.

along with `_source` and `_status` properties from the raw data.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| event | `{Event\|null}` | The optional event to prevent default on. |
| url | `{string}` | The URL from which to scrape the recipe. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<Object>}` | A promise that resolves to an object containing the formatted recipe data, |

**Throws**

| Type | Description |
| --- | --- |
| @throws Will throw an error if the scraping fails. |  |

### handleParse
Parses text for recipe data.
Optionally prevents the default behavior of a passed event.

along with `_source` and `_status` properties from the raw data.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| event | `{Event\|null}` | The optional event to prevent default on. |
| text | `{string}` | The text to parse for recipe data. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<Object>}` | A promise that resolves to an object containing the formatted recipe data, |

**Throws**

| Type | Description |
| --- | --- |
| @throws Will throw an error if the parsing fails. |  |

### formatScrapedRecipe
Reusable formatting function for both methods
Formats scraped recipe data into a standardized object.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| raw | `{Object}` | The scraped recipe data. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object}` | The formatted recipe data. |


## parseTesting.js
### mockFetchForURL
Mocks the global fetch function to read from local HTML files instead of making actual HTTP requests.
This is useful for testing purposes to avoid making real network requests.

### urlToFilename
Converts a given URL to a simplified filename string.
This is useful for saving web pages locally with a filename derived from their URL.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| url | `{string}` | The URL to convert. |

**Returns**

| Type | Description |
| --- | --- |
| `{string}` | The simplified filename string. |
