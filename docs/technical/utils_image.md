# Utility Functions – Image

## imageBackend.js
### deleteSinglePhotoFile
Deletes a single photo file from the filesystem.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| id | `{string}` | The ID of the photo. |
| fileType | `{string}` | The file type of the photo (e.g., 'jpg', 'png'). |

### downloadImage
Downloads an image from a given URL and saves it to the file system.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| url | `{string}` | The URL of the image to download. |
| photoFilename | `{string}` | The filename of the downloaded image. |
| directory | `{string}` | The directory to save the downloaded image in. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<void>}` | A promise that resolves when the image has been downloaded and saved. |

**Throws**

| Type | Description |
| --- | --- |
| `{Error}` | If the image type is not supported. |

### resizeImage
Resizes an image to fit within a given maximum size.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| inputPath | `{string}` | The path to the image to be resized. |
| outputPath | `{string}` | The path to write the resized image to. |
| maxSize | `{number}` | The maximum width and height of the resized image. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<void>}` | A promise that resolves when the image has been resized and saved. |

### processImage
Downloads an image, validates its type, saves it to a file, resizes it,
and saves the resized version back to the same file.

if the image was successfully processed and saved.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| imageUrl | `{string}` | The URL of the image to be downloaded. |
| uid | `{string}` | The unique identifier for the image. |
| fileExtension | `{string}` | The extension of the image file. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<boolean>}` | A promise that resolves to a boolean indicating |

### downloadImageAsBuffer
Downloads an image from a given URL and returns it as a buffer.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| url | `{string}` | The URL of the image to download. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<Buffer>}` | A promise that resolves with the downloaded image as a buffer. |


## imageUtils.js
### getContentTypeFromUrl
Fetches the Content-Type of a given URL by making a HEAD request.


**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| url | `{string}` | The URL to fetch the Content-Type for. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<string\|null>}` | A promise that resolves to the Content-Type of the URL, or null if the request fails. |

### mapContentTypeToFileTypeAndExtension
Maps a given Content-Type to its corresponding file type and extension.

Defaults to 'image/jpeg' and 'jpg' if the Content-Type is unrecognized.

**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| contentType | `{string}` | The Content-Type to map. |

**Returns**

| Type | Description |
| --- | --- |
| `{Object}` | An object containing the fileType and extension. |

### checkImageExistence
Checks if the given image URL exists remotely.



**Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| imageUrl | `{string}` | The URL of the image to check. |
| baseUrl | `{string}` | The base URL of the API to make the request to. |

**Returns**

| Type | Description |
| --- | --- |
| `{Promise<boolean>}` | A promise that resolves to a boolean indicating whether the image exists or not. |
