# If running local dev

1. Make sure the code at _+layout.svelte_ to generate the service worker is uncommented
2. Make sure the _.env_ file has the correct `ORIGIN_URL`
3. Generate the service worker: `npm run generate-sw`
4. Run the replacement script: `bash sw-domain.sh`
5. Run the build: `npm run build:localprod`
6. Run the dev server: `nodemon --exec "node build/index.js"`

# To Deploy

1. The Dockerfile needs to generate the service worker: `RUN npm run generate-sw`
2. In _entrypoint.sh_, the replacement script needs to run: `./sw-domain.sh` (this will depend on the local deployment environment) - replaces the `%%URLPATTERN%%` in the generated service-worker files.
