# Getting Started Locally

1. Clone the repo and the recipe-ingredient-parser submodule: `git clone --recursive https://github.com/jt196/recipe-manager-prisma.git`
2. Install the base packages: `npm i`
3. Create the folders for the static photos and the db
   - uploads/
   - prisma/db
4. Move the .paprikarecipes file into the import folder. If you have one already, move the categories.json file there, if you don't it should be created if you're polling the Paprika API.
5. Add your admin user details and Paprika log in details to the .env.template file.
6. Rename this to .env, or just run `cp .env.example .env` in the root of the project.
7. `npx prisma migrate dev --name init`
8. Generate the Prisma client and types (is this typescript?): `npx prisma generate`

# Getting Started with Docker

1. Add the _.env.example_ file from the repo to the project folder
2. Rename it _.env_
3. Add the admin user details, as well as the Paprika details (optional)
4. Add the _docker-compose.yml_ file to the folder
5. Create import (optional), db and uploads folders for persistence
6. If you're importing a .paprikarecipes file, add that to the import/ folder
7. If you're importing categories too, and already have the categories.json, add that to the folder.
8. Run `docker-compose up -d`

# Deployment/Change Workflow

As it stands with the current local/NAS setup

1. Make changes on local disk
2. Confirm they work - run tests etc
3. Sync with the Git repo
4. This should build the Docker image
5. Either wait for Watchtower to update it OR
6. Update it manually:
   1. log into wherever the Docker images are
   2. `docker pull jt196/cookrr`
   3. `cd` into the project folder
   4. `docker-compose up -d`

Another option is to run a simple Express or Flask docker image that checks for updates and pings the Watchtower API. Honestly not sure if that's worth bothering with.
