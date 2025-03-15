# Recipe List View

![Recipe View Desktop](../images/screen-list-large-annotated.jpg)

## Buttons

From left to right:

- **Add Recipe**: Add new recipes manually or using the scraper
- **[Shopping List](apps.md#shopping)**: A simple list to help you with your weekly shop
- **[Calendar](apps.md#calendar)**: Visual record of your previous cooked recipes
- **Users**: List of the users on your instance
- **Settings**: Configuration section

## Filters

From left to right

- **Display Category Tree** - Imported Paprika categories will be displayed here
- **Filter with text string** - Search by multiple methods
- **Specify filter** - Name, Ingredient, Source, Notes
- **Filter favourites** - List all your favourite recipes
- **Filter cooked** - List all the cooked recipes
- **Sort by Date, Title or Rating** - Sort the recipes by various means

## Recipe Card

Displays info about your recipes.

# Recipe View

![Recipe Card](../images/screen-recipe-large-annotated.jpg)

## Recipe Buttons

From left to right:

- **Back** to the recipe list
- **Edit Recipe**
- **Manage Images**
- **Favourite Recipe**
- **Mark Recipe as Cooked today**
- **Delete Recipe**

## Recipe About

All your recipe info is here. Ratings, source, creation date, servings.

## Recipe Instructions

Description, Instructions and Notes sections will appear here. Markdown is fully supported.

## Recipe Ingredients

Your list of ingredients and scaling appear here. Markdown is also fully supported. The ingredients are stored as plain text and parsed by the backend. This allows for conversion from US volumetric to weight conversion.

A typical ingredient should appear like this:

- 1 cup of sugar, granulated
- 200g of flour (sifted)

The comma or the brackets are accepted as "extras". If you've got extra extras, this is likely why your ingredient isn't parsing correctly. Open up the editor and adjust the ingredient line to be closer to type.

Click on the ingredient line to mark as "checked" for the duration of the recipe.

Hover over and click to the left of the ingredient to add it to the shopping list.

# Add Recipe

![Recipe View Desktop](../images/screen-recipe-add.jpg)

Add your recipe here.

## Scrape It

Either use the old skool bookmarklet (found in /user/options/bookmark), or paste the URL in the first box, then press scrape.

Not all websites are supported, but quite a few, mostly those that have good Schema.org recipe data. Not all of them do unfortunately.

## Add it

Otherwise, add your recipe details and click the **Add Recipe** button at the bottom. The Edit page is basically the same as this. If the images are successfully saved, they'll be in the _uploads/images_ folder.

# Options

![Settings](../images/settings.jpg)

I've tried to keep most of the under the hood stuff here.

- **Settings**
  - **Teaspoons instead of grams** - use these instead of weight for smaller measures
  - **Profile public** - show/hide your profile in the _/users_ view
  - **Recipes public** - make your recipe public by default
  - **Selected System** - Choose your preferred measurement system
- **Bookmark** - grab your bookmarklet for saving recipes to the site.
- **Import**, **Export**, **Upload** see the [Import Docs](import.md).
- **Users** - admin only. User management. Change passwords, add and remove users etc.
- **Site** - admin only. Turn on/off registrations.
