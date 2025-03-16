# If running local dev

1. Make sure the code at _+layout.svelte_ to generate the service worker is uncommented
2. Make sure the _.env_ file has the correct `ORIGIN_URL`
3. Run `pnpm start` and that should generate everything you need.

# To Deploy

1. The Dockerfile runs all necessary steps with the `pnpm build` command.
2. In _entrypoint.sh_, `npm serve` will run the replacement script: `./sw-domain.sh`. This will depend on the local deployment environment, and replaces the `%%URLPATTERN%%` in the generated service-worker files.
