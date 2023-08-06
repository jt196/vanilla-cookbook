export interface Recipe {
	title: string
	uid: string
	auth_user: string
	categories: Category[] | null
	content: string | null
	rating: number | null
	photo_hash: string | null
	on_favorites: boolean | null
	photo: string | null
	scale: number | null
	ingredients: string | null
	is_pinned: boolean | null
	source: string | null
	total_time: string | null
	hash: string | null
	description: string | null
	source_url: string | null
	difficulty: string | null
	on_grocery_list: boolean | null
	in_trash: boolean | null
	directions: string | null
	photo_url: string | null
	cook_time: string | null
	name: string | null
	created: Date
	notes: string | null
	photo_large: string | null
	image_url: string | null
	prep_time: string | null
	servings: string | null
	nutritional_info: string | null
}

export interface Category {
	order_flag: number | null
	uid: string
	parent_uid: string | null
	name: string
}

// Define an IRecord interface to represent a generic object that has a string as a key and any type as its value.
// This allows the function to accept arrays of objects with dynamic keys and values.
export interface IStringDateRecord {
	[key: string]: string | Date // Assume the keys hold either strings or Dates.
}

export interface IGenericRecord {
	[key: string]: any
}
