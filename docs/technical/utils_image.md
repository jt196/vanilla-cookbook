# Utility Functions – Image

## imageBackend.js
### deleteSinglePhotoFile
Deletes a single photo file from the filesystem.

@param {string} id - The ID of the photo.
@param {string} fileType - The file type of the photo (e.g., 'jpg', 'png').

### Function 2
Downloads an image from a given URL and saves it to the file system.


@param {string} url - The URL of the image to download.
@param {string} photoFilename - The filename of the downloaded image.
@param {string} directory - The directory to save the downloaded image in.
@throws {Error} If the image type is not supported.
@returns {Promise<void>} A promise that resolves when the image has been downloaded and saved.

### resizeImage
Resizes an image to fit within a given maximum size.

@param {string} inputPath - The path to the image to be resized.
@param {string} outputPath - The path to write the resized image to.
@param {number} maxSize - The maximum width and height of the resized image.
@returns {Promise<void>} A promise that resolves when the image has been resized and saved.

### processImage
Downloads an image, validates its type, saves it to a file, resizes it,
and saves the resized version back to the same file.

if the image was successfully processed and saved.

@param {string} imageUrl - The URL of the image to be downloaded.
@param {string} uid - The unique identifier for the image.
@param {string} fileExtension - The extension of the image file.
@returns {Promise<boolean>} A promise that resolves to a boolean indicating

### downloadImageAsBuffer
Downloads an image from a given URL and returns it as a buffer.


@param {string} url - The URL of the image to download.
@returns {Promise<Buffer>} A promise that resolves with the downloaded image as a buffer.


## imageUtils.js
### getContentTypeFromUrl
Fetches the Content-Type of a given URL by making a HEAD request.


@param {string} url - The URL to fetch the Content-Type for.
@returns {Promise<string|null>} A promise that resolves to the Content-Type of the URL, or null if the request fails.

### mapContentTypeToFileTypeAndExtension
Maps a given Content-Type to its corresponding file type and extension.

Defaults to 'image/jpeg' and 'jpg' if the Content-Type is unrecognized.

@param {string} contentType - The Content-Type to map.
@returns {Object} An object containing the fileType and extension.

### checkImageExistence
Checks if the given image URL exists remotely.



@param {string} imageUrl - The URL of the image to check.
@param {string} baseUrl - The base URL of the API to make the request to.
@returns {Promise<boolean>} A promise that resolves to a boolean indicating whether the image exists or not.
