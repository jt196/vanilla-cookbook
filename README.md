# Getting Started

1. Clone the repo and the recipe-ingredient-parser submodule: `git clone --recursive https://github.com/jt196/recipe-manager-prisma.git`
2. Install the base packages: `npm i`
3. Create the folders for the static photos and the db
   - static/recipe_photos
   - prisma/db
4. Move the .paprikarecipes file into the import folder. If you have one already, move the categories.json file there, if you don't it should be created if you're polling the Paprika API.
5. Add your admin user details and Paprika log in details to the .env.template file.
6. Rename this to .env, or just run `cp .env.example .env` in the root of the project.
7. Initialise the Prisma db: `npx prisma migrate dev --name init`
   - This will run the seed.js file as well.
8. Generate the Prisma client and types (is this typescript?): `npx prisma generate`
