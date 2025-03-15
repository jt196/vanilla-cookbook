# Getting Started Locally

1. Clone the repo and the recipe-ingredient-parser submodule: `git clone --recursive https://github.com/jt196/vanilla-cookbook.git`
2. At the root of the project, create the .env file: `cp .env.template .env`
3. In the _.env_ file
   1. Add your admin user details
   2. Change the _ORIGIN_ to something like http://locahost:3000, or http://locahost:5173, depending on whether you're running dev or prod.
4. Make sure the setup script is executable: `chmod +x local-setup.sh`
5. Run it: `./local-setup.sh`

# Getting Started with Docker

1. In your project directory, create the _.env_ and _docker-compose.yml_ files using the respective _.template_ files in the repo root
2. In the _.env_ file
   1. Add the admin user details.
   2. Change the _ORIGIN_ to the URL it's going to be hosted on. If you get any login CORS messages, this not being set correctly will be the reason.
3. Create _db_ and _uploads_ folders for persistence in your docker folder, make sure the share paths are correct in the docker-compose file.
4. Run `docker-compose up -d`
