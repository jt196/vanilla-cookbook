/**
 * @typedef {Object} Recipe
 * @property {string} uid
 * @property {(number|null)} rating
 * @property {(string|null)} photo_hash
 * @property {(boolean|null)} on_favorites
 * @property {(string|null)} photo
 * @property {(string|null)} scale
 * @property {(string|null)} ingredients
 * @property {(boolean|null)} is_pinned
 * @property {(string|null)} source
 * @property {(string|null)} total_time
 * @property {(string|null)} hash
 * @property {(string|null)} description
 * @property {(string|null)} source_url
 * @property {(string|null)} difficulty
 * @property {(boolean|null)} on_grocery_list
 * @property {(boolean|null)} in_trash
 * @property {(string|null)} directions
 * @property {(string|null)} photo_url
 * @property {(string|null)} cook_time
 * @property {(string|null)} name
 * @property {Date} created
 * @property {(string|null)} notes
 * @property {(string|null)} photo_large
 * @property {(string|null)} image_url
 * @property {(string|null)} prep_time
 * @property {(string|null)} servings
 * @property {(string|null)} nutritional_info
 */

/**
 * @typedef {Object} PaprikaRecipe
 * @property {string} title
 * @property {string} uid
 * @property {string} auth_user
 * @property {(Category[]|null)} categories
 * @property {(string|null)} content
 * @property {(number|null)} rating
 * @property {(string|null)} photo_hash
 * @property {(boolean|null)} on_favorites
 * @property {(string|null)} photo
 * @property {(number|null)} scale
 * @property {(string|null)} ingredients
 * @property {(boolean|null)} is_pinned
 * @property {(string|null)} source
 * @property {(string|null)} total_time
 * @property {(string|null)} hash
 * @property {(string|null)} description
 * @property {(string|null)} source_url
 * @property {(string|null)} difficulty
 * @property {(boolean|null)} on_grocery_list
 * @property {(boolean|null)} in_trash
 * @property {(string|null)} directions
 * @property {(string|null)} photo_url
 * @property {(string|null)} cook_time
 * @property {(string|null)} name
 * @property {Date} created
 * @property {(string|null)} notes
 * @property {(string|null)} photo_large
 * @property {(string|null)} image_url
 * @property {(string|null)} prep_time
 * @property {(string|null)} servings
 * @property {(string|null)} nutritional_info
 */

/**
 * @typedef {Object} Category
 * @property {(number|null)} order_flag
 * @property {string} uid
 * @property {(string|null)} parent_uid
 * @property {string} name
 */

/**
 * @typedef {Object} stringDateRecord
 * @property {string} key
 * @property {(string|Date)} value
 */

/**
 * @typedef {Object} IGenericRecord
 * @property {string} key
 * @property {*} value
 */

/**
 * @typedef {Object} parsedIngredient
 * @property {(number|undefined)} quantity
 * @property {(string|null|undefined)} unit
 * @property {(string|null|undefined)} unitPlural
 * @property {(string|null|undefined)} symbol
 * @property {(string|null|undefined)} ingredient
 * @property {(number|undefined)} minQty
 * @property {(number|undefined)} maxQty
 */
