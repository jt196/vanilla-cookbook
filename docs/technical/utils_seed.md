# Utility Functions – Seed

## seedHelpers.js

### dbExists

Checks if the SQLite database file exists in the specified path.

#### Returns

| Type | Description |
| --- | --- |
| `{Promise<boolean>}` | A promise that resolves to true if the database file exists, otherwise false. |

@async
@function

### dbSeeded

Checks if the database has been seeded by verifying the existence of site settings.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| prismaClient | `{PrismaClient}` | The Prisma client instance to interact with the database. |

#### Returns

| Type | Description |
| --- | --- |
| `{Promise<boolean>}` | A promise that resolves to true if the site settings exist, indicating the database has been seeded, otherwise false. |

@async
@function

### seedRecipes

Seeds the database with predefined recipes for a given admin user.

This function iterates over the predefined `recipes` array, inserting each recipe
into the database associated with the provided admin user ID. For each recipe, it also
attempts to create entries for any associated photos and processes the images.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| adminUserId | `{string}` | The ID of the admin user to associate the recipes with. |
| prismaClient | `{PrismaClient}` | The Prisma client instance used for database operations. |

@async
@function


## seedIng.js

### seedIngredients

Seeds the ingredients table from the _dry_ingredient_data.csv_ file.
This runs at startup via the _seed.js_ script on the `pnpm seed` command

1. Checks the current version from SiteSettings.
2. Checks if the current version is less than the expected version.
3. If the version is less than the expected version, this function:
a. Clears the existing data in the Ingredient table.
b. Reads the CSV file using csv-parser with proper configuration.
c. Seeds the Ingredient table with the data from the CSV file.
d. Updates the version in SiteSettings to the expected version.
4. If the version is not less than the expected version, logs a message indicating the data is up to date.

#### Parameters

| Parameter | Type | Description |
| --- | --- | --- |
| prismaClient | `{PrismaClient}` | The Prisma client instance to interact with the database. |

@async
@function


## seed.js

### runSeed

Seeds the database with initial data by creating site settings and running
the ingredient seeder.

On set up, it sets the version number to 0, so the `seedIngredients()` populates the db.

This runs when the dev or docker starts and shouldn't do anything if

- The database is already seeded
- The ingredients are up to date - this is determined by the version
number in the siteSettings saved inside the db, and the version number in
the _config.js_ file.

Updating ingredients is fairly simple

1. Add any new lines to the _data/ingredients/dry_ingredient_data.csv_ file
2. Update the version number in the _config.js_ file.
e.g. `export const ingVersion = 2.38` -> `2.39`

#### Returns

| Type | Description |
| --- | --- |
| `{Promise<void>}` |  |

@async
@function
