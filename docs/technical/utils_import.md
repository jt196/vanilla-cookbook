# Utility Functions – Import

## recipeImport.js

### extractRecipes

Extracts recipes from a given zip file.
Doesn't use local storage, runs everything in memory.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| zipFilePath | `{string}` | The path to the zip file containing the recipes. |

#### Returns

| Type | Description |
| --- | --- |
| `{Promise<Array>}` | An array of extracted recipes. |

### filterRecipeData

Filters the recipe JSON data to only include fields that exist in the database.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| recipe | `{Object}` | The recipe data to be filtered. |

#### Returns

| Type | Description |
| --- | --- |
| `{Object}` | The filtered recipe data. |


## files.js

### isValidFileType

Validates the file type of a given stream against desired extensions.
Check for multiple types: isValidFileType(file, ['zip', 'gzip'])
Check for a single type: isValidFileType(file, 'zip')

any of the desired extensions, false otherwise.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| stream | `{ReadableStream}` | The stream of the file to be checked. |
| desiredExtensions | `{string\|string[]}` | The extension(s) to validate against. |

#### Returns

| Type | Description |
| --- | --- |
| `{Promise<boolean>}` | A promise that resolves to true if the file type matches |

### saveFile

Saves a given file data to a specified filename in a given directory.
If the file already exists, this function will not overwrite it.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| fileData | `{ArrayBuffer\|string}` | The data of the file to be saved. |
| filename | `{string}` | The name of the file to be saved. |
| directory | `{string}` | The directory in which to save the file. |

#### Throws

| Type | Description |
| --- | --- |
| `{Error}` | If there is an error while saving the file. |

### isValidRecipeStructure

Checks if the given recipes data structure is valid.
This function checks if the given data is an array of objects,
and if the first object in the array has the required fields.
The required fields are:

- name: a string

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| recipes | `{Array}` | The recipes data structure to be validated. |

@return {boolean} true if the structure is valid, false otherwise.
