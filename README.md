# Getting Started

1. Clone the repo and the recipe-ingredient-parser submodule: `git clone --recursive https://github.com/jt196/recipe-manager-prisma.git`
2. Install the base packages: `npm i`
3. Create the folders for the static photos and the db
   - static/recipe_photos
   - prisma/db
4. Initialise the Prisma db: `npx prisma migrate dev --name init`
   - This will run the seed.js file as well.
5. Generate the Prisma client and types (is this typescript?): `npx prisma generate`
