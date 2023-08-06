// Define an IRecord interface to represent a generic object that has a string as a key and any type as its value.
// This allows the function to accept arrays of objects with dynamic keys and values.
interface IRecord {
	[key: string]: any
}

// Annotate the searchString parameter with string | null type. This means searchString can be either a string or null.
// Annotate the data parameter with IRecord[], which is an array of IRecord objects.
// Annotate the key parameter with string type, since keys in JavaScript objects are strings.
// Annotate the function's return type with IRecord[].
export function filterSearch(searchString: string | null, data: IRecord[], key: string): IRecord[] {
	// copy array
	let myFilteredArray = data
	// filter the array with favourites or search criteria
	if (searchString) {
		// Run filter on name of recipe
		myFilteredArray = myFilteredArray.filter((r) =>
			// Added a safety check r[key]?.toString() to make sure that if the key exists,
			// its value will be converted to a string before applying the toLowerCase() method.
			// This prevents potential runtime errors if the value is not a string.
			r[key]?.toString().toLowerCase().includes(searchString.toLowerCase())
		)
	}
	return myFilteredArray
}
