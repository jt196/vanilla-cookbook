# Paprika Importing

As my main app of usage was Paprika, I've designed this to primarily import and export .paprikarecipes files. It works pretty well, unfortunately, the category hierarchy isn't exported with this file. You have to grab it from the Paprika API.

If you have recipes inside Paprika, the best workflow is the following:

## 1. Import Categories via API

The API category file contains hierarchical information that the recipe file doesn't export. I've designed the app to take the hierarchy into account.

1. Go to Settings > Import
2. Enter your Paprika user/pass
3. Click on Download Paprika Categories
4. If successful, you should see some feedback.
5. If you refresh the page, you should see some information about your download. (I need to make this happen after import)
6. Press the import categories button.
7. You should see a success message, and the number of categories in DB should match up with the file categories.
8. You can delete the file now, or leave it as a backup.

## 2. Import Recipes via File

1. Go to Settings > Upload
2. Browse a file to upload (if it's more than 5MB, you'll need to change the BODY_SIZE_LIMIT env variable in the main .env file)
3. If you have access to the _Uploads/Imports_ folder, you can also copy the file in there. You'll need to rename it <user*id>*<myfile>.paprikarecipes, e.g. _aXronQVri1BCbeK_recipes.paprikarecipes_. If you go to the main recipes page, your user id should be there in the url, e.g. _user/aXronQVri1BCbeK/recipes_.
4. Once the upload has complete, or the file has been copied and correctly named, you should see it under the **Import an uploaded Paprika file** section.
5. Click import. Check **Recipes Public** if you want your recipes to be public.
6. Delete the file if no longer needed.

## Importing Paprika Recipes via API

_(Not recommended)_

Note this should kind of work, but it's super slow and may cause polling issues. You're downloading a small file which is a list of recipes containing only the _id_ and a few other bits, then polling the API for the full recipe, one by one. It's slow and arduous and will take several minutes. If you have a local file, it'll be much quicker and easier.

# Exporting Paprika Recipes Files

Head to _user/options/export_ and download your recipes there. Images won't export unfortunately.
