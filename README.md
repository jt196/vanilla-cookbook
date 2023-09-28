# Getting Started

1. Clone the repo and the recipe-ingredient-parser submodule: `git clone --recursive https://github.com/jt196/recipe-manager-prisma.git`
2. Install the base packages: `npm i`
3. Create the folders for the static photos and the db
   - uploads/
   - prisma/db
4. Move the .paprikarecipes file into the import folder. If you have one already, move the categories.json file there, if you don't it should be created if you're polling the Paprika API.
5. Add your admin user details and Paprika log in details to the .env.template file.
6. Rename this to .env, or just run `cp .env.example .env` in the root of the project.
7. Initialise the Prisma db: `npx prisma migrate dev --name init` - for docker, this command needs to be `npx prisma migrate deploy` (no name)
   - This will run the seed.js file as well.
8. Generate the Prisma client and types (is this typescript?): `npx prisma generate`

# Deployment Workflow

As it stands with the current local/NAS setup

1. Make changes on local disk
2. Confirm they work - run tests etc
3. Sync with the Git repo
4. Go to the _paprika-dev_ folder on the NAS
5. Sync the changes from the remote Git repo
6. Build the image: `docker build -t recipe-manager .`
7. Go to the _recipe-manager_ folder in the _docker_ folder
8. Run `docker-compose up -d`

This should be all it takes currently.
