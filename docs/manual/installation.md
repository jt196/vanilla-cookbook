# Getting Started for Local Dev

1. Clone the repo and the recipe-ingredient-parser submodule: `git clone --recursive https://github.com/jt196/vanilla-cookbook.git`
2. At the root of the project, create the .env file: `cp .env.template .env`
3. In the _.env_ file
   1. Add your admin user details
   2. Set `ORIGIN` to `http://localhost:5173` (dev).
4. Install the node packages: `pnpm i`
5. Run it
   - `pnpm dev:setup` (this should only need to be run the first time to generate the )
   - `pnpm dev`

# Getting Started with Docker

1. In your project directory, create the _.env_ and _docker-compose.yml_ files using the respective _.template_ files in the repo root
2. In the _.env_ file
   1. Add the admin user details.
   2. Change the _ORIGIN_ to the URL it's going to be hosted on. If you get any login CORS messages, this not being set correctly will be the reason. The default `ORIGIN=http://localhost:3000` should work with the default _docker-compose.yml_ file unless you have anything else on that port.
3. Create _db_ and _uploads_ folders for persistence in your docker folder, make sure the share paths are correct in the docker-compose file.
4. Run `docker-compose up -d`
