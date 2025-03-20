Vanilla Cookbook is a self hosted recipe manager built with Svelte(kit). It is designed with complexity under the hood, keeping the user experience as vanilla as possible.

![Recipe View Desktop](images/screen-list-large.jpg)

The philosophy behind building the app was to reduce the complexity for the user to manage their recipes by making everything stored in plain text: all the recipe fields are simple text strings. Scaling and conversion is all done via text parsing. What this means is, if you scrape a recipe, providing the recipe app is doing a good job (caveat emptor!) you can start cooking it straight away. If it doesn't immediately work, a few simple text tweaks should be enough to get you going. Volumetric conversion is done via a dry weight > volume look up from a huge database of 3000 or so ingredients.

## Control Your Data

Bring in and export your data in Paprika format. Category hierarchy is supported.

## Scraping Recipes

Scrape recipes using a browser bookmarklet or simply paste a URL in. Hundreds of sites supported.

## AI Scrape Assist

Add an OpenAI key to assist in parsing recipe data.

## Unit Conversion

Smart conversion from US Volumetric to imperial and metric weight. Thousands of ingredients supported in this conversion. Inline temperature conversion is also supported.

## Shopping List

Simple shopping list section. Add ingredients from your recipe.

## Cooking Logs

Log when you've cooked a recipe. Calendar view.

## User Management

User authentication is supported. You can add users, turn on/off registration.

## Public Recipes

Recipes and your personal cookbook can be made public, so you can share them with friends and family.

## Easy Installation

Designed to be as easy and stress free to set up as possible. Docker or local node instance.
